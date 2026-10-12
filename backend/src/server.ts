import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool, initDatabase, isDatabaseInitialized, ensureDatabase } from './db.js';
import {
  AuthRequest,
  authMiddleware,
  requireAdmin,
  generateToken
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// Middleware para garantir que o banco seja conectado/migrado assim que disponível
app.use(async (req, _res, next) => {
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/health') && !isDatabaseInitialized) {
    try {
      await ensureDatabase();
    } catch {
      // Deixa prosseguir caso ainda esteja offline
    }
  }
  next();
});

// --- DIAGNÓSTICO E HEALTHCHECK ---

// GET /api/health
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseInitialized: isDatabaseInitialized
  });
});

// GET /api/db/status (Verifica conexão e lista tabelas reais)
app.get('/api/db/status', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      res.json({
        connected: true,
        databaseInitialized: isDatabaseInitialized,
        tablesCount: tablesRes.rows.length,
        tables: tablesRes.rows.map(r => r.table_name),
        databaseUrlConfigured: !!process.env.DATABASE_URL
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      databaseInitialized: isDatabaseInitialized,
      error: err.message,
      code: err.code,
      databaseUrlConfigured: !!process.env.DATABASE_URL
    });
  }
});

// ALL /api/db/init (Força migração e criação das tabelas no PostgreSQL)
app.all('/api/db/init', async (_req: Request, res: Response) => {
  try {
    await initDatabase();
    res.json({
      success: true,
      message: 'Migração executada com sucesso! Tabelas e dados padrão criados no PostgreSQL.',
      databaseInitialized: isDatabaseInitialized
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

// --- 1. ROTAS DE AUTENTICAÇÃO ---


// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, status, token_version, must_change_password FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const user = result.rows[0];

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Usuário desativado pela administração' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: user.must_change_password
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao processar login' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
    return;
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = false, token_version = token_version + 1, updated_at = NOW() 
       WHERE id = $2`,
      [hash, req.user!.id]
    );

    res.json({ message: 'Senha alterada com sucesso! Faça login novamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// --- 2. ROTAS DE ESTOQUE (REGRA DE OURO) ---

// Helper para calcular saldo disponível por vendedor
async function calculateStockSummary(sellerId: string) {
  const products = await pool.query('SELECT * FROM products ORDER BY id');
  const userRes = await pool.query('SELECT low_stock_threshold FROM users WHERE id = $1', [sellerId]);
  const threshold = userRes.rows[0]?.low_stock_threshold ?? 5;

  const summaries = [];

  for (const prod of products.rows) {
    const movRes = await pool.query(
      `SELECT type, SUM(quantity) as total 
       FROM stock_movements 
       WHERE seller_id = $1 AND product_id = $2 
       GROUP BY type`,
      [sellerId, prod.id]
    );

    let totalSent = 0;
    let totalSold = 0;
    let corrections = 0;

    for (const row of movRes.rows) {
      const qty = parseInt(row.total, 10) || 0;
      if (row.type === 'IN_SHIPMENT') totalSent += qty;
      if (row.type === 'OUT_SALE') totalSold += Math.abs(qty);
      if (row.type === 'IN_REVERSAL') totalSold -= qty;
      if (row.type === 'CORRECTION') corrections += qty;
    }

    const availableStock = Math.max(0, totalSent + corrections - totalSold);

    summaries.push({
      productId: prod.id,
      productName: prod.name,
      totalSent,
      totalSold: Math.max(0, totalSold),
      corrections,
      availableStock,
      isLowStock: availableStock <= threshold
    });
  }

  return summaries;
}

// GET /api/stock/summary
app.get('/api/stock/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  const targetSellerId = req.user!.role === 'ADMIN' && req.query.sellerId
    ? String(req.query.sellerId)
    : req.user!.id;

  try {
    const summary = await calculateStockSummary(targetSellerId);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular estoque' });
  }
});

// GET /api/stock/movements
app.get('/api/stock/movements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query = 'SELECT * FROM stock_movements';
    const params: any[] = [];

    if (req.user!.role === 'SELLER') {
      query += ' WHERE seller_id = $1';
      params.push(req.user!.id);
    } else if (req.query.sellerId) {
      query += ' WHERE seller_id = $1';
      params.push(req.query.sellerId);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ movements: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

// POST /api/stock/shipment (ADMIN ONLY)
app.post('/api/stock/shipment', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { sellerId, googleQty, instagramQty, notes } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (googleQty > 0) {
      const movId = `mov-${Date.now()}-goog`;
      await client.query(
        `INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, reason, created_by)
         VALUES ($1, $2, 'google', 'IN_SHIPMENT', $3, $4, $5)`,
        [movId, sellerId, googleQty, notes || 'Remessa enviada pela administração', req.user!.id]
      );
    }

    if (instagramQty > 0) {
      const movId = `mov-${Date.now()}-insta`;
      await client.query(
        `INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, reason, created_by)
         VALUES ($1, $2, 'instagram', 'IN_SHIPMENT', $3, $4, $5)`,
        [movId, sellerId, instagramQty, notes || 'Remessa enviada pela administração', req.user!.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Remessa lançada com sucesso no estoque!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao lançar remessa' });
  } finally {
    client.release();
  }
});

// POST /api/stock/correction (ADMIN ONLY)
app.post('/api/stock/correction', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { sellerId, productId, adjustmentQty, reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ error: 'Motivo detalhado é obrigatório para correções de estoque' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Valida se o ajuste não deixará saldo negativo
    const summary = await calculateStockSummary(sellerId);
    const prodItem = summary.find(s => s.productId === productId);
    const currentStock = prodItem ? prodItem.availableStock : 0;

    if (currentStock + adjustmentQty < 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: `Ajuste deixaria saldo negativo (${currentStock + adjustmentQty}). Recusado.` });
      return;
    }

    const movId = `mov-corr-${Date.now()}`;
    await client.query(
      `INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, reason, created_by)
       VALUES ($1, $2, $3, 'CORRECTION', $4, $5, $6)`,
      [movId, sellerId, productId, adjustmentQty, `[CORREÇÃO AUDITADA] ${reason}`, req.user!.id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Correção de estoque aplicada com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao aplicar correção de estoque' });
  } finally {
    client.release();
  }
});

// --- 3. ROTAS DE VENDA (TRANSAÇÃO ATÔMICA ACID) ---

// GET /api/sales
app.get('/api/sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query = `
      SELECT s.*, u.name as seller_name 
      FROM sales s 
      JOIN users u ON s.seller_id = u.id
    `;
    const params: any[] = [];

    if (req.user!.role === 'SELLER') {
      query += ' WHERE s.seller_id = $1';
      params.push(req.user!.id);
    }

    query += ' ORDER BY s.sale_date DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json({ sales: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar vendas' });
  }
});

// POST /api/sales (TRANSAÇÃO ATÔMICA COM VALIDAÇÃO DE SALDO E IDEMPOTÊNCIA)
app.post('/api/sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  const {
    productId,
    establishmentName,
    quantity,
    nfcConfigured,
    qrcodeTested,
    clientRequestId
  } = req.body;

  const sellerId = req.user!.id;

  if (!establishmentName || !quantity || quantity <= 0) {
    res.status(400).json({ error: 'Dados da venda inválidos' });
    return;
  }

  if (!nfcConfigured || !qrcodeTested) {
    res.status(400).json({ error: 'Validações de NFC e QR Code são obrigatórias' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Idempotência: Se já existir venda com o mesmo clientRequestId, retorna original
    if (clientRequestId) {
      const existing = await client.query('SELECT * FROM sales WHERE client_request_id = $1', [clientRequestId]);
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        res.json({ success: true, sale: existing.rows[0], message: 'Venda já sincronizada anteriormente' });
        return;
      }
    }

    // 2. Validação Atômica de Saldo
    const summary = await calculateStockSummary(sellerId);
    const prodItem = summary.find(s => s.productId === productId);
    const availableStock = prodItem ? prodItem.availableStock : 0;

    if (quantity > availableStock) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: `Saldo insuficiente! Saldo disponível: ${availableStock} placa(s).` });
      return;
    }

    const saleId = `sale-${Date.now()}`;
    const unitPrice = 90.00;
    const commissionAmount = quantity * 20.00;
    const totalPrice = quantity * unitPrice;
    const reqId = clientRequestId || `req-${Date.now()}`;

    // 3. Insere Venda
    await client.query(
      `INSERT INTO sales (
        id, seller_id, product_id, establishment_name, quantity,
        unit_price, total_price, commission_amount, nfc_configured, qrcode_tested,
        client_request_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, $9, 'ACTIVE')`,
      [saleId, sellerId, productId, establishmentName, quantity, unitPrice, totalPrice, commissionAmount, reqId]
    );

    // 4. Cria Saída de Estoque
    await client.query(
      `INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, sale_id, created_by)
       VALUES ($1, $2, $3, 'OUT_SALE', $4, $5, $6)`,
      [`mov-${Date.now()}`, sellerId, productId, -quantity, saleId, sellerId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Venda confirmada com sucesso! Estoque debitado e comissão gerada.',
      sale: {
        id: saleId,
        productId,
        establishmentName,
        quantity,
        totalPrice,
        commissionAmount
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', err);
    res.status(500).json({ error: 'Erro ao processar transação de venda' });
  } finally {
    client.release();
  }
});

// POST /api/sales/:id/reverse (ADMIN ONLY - ESTORNO COM DEVOLUÇÃO AO ESTOQUE)
app.post('/api/sales/:id/reverse', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const saleId = req.params.id;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 4) {
    res.status(400).json({ error: 'Justificativa do estorno é obrigatória' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1', [saleId]);
    if (saleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }

    const sale = saleRes.rows[0];
    if (sale.status === 'CANCELLED') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Esta venda já foi estornada' });
      return;
    }

    // 1. Marca venda como CANCELLED
    await client.query(
      `UPDATE sales 
       SET status = 'CANCELLED', cancelled_by = $1, cancelled_at = NOW(), cancel_reason = $2 
       WHERE id = $3`,
      [req.user!.id, reason, saleId]
    );

    // 2. Movimento de devolução de estoque (IN_REVERSAL)
    await client.query(
      `INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, sale_id, reason, created_by)
       VALUES ($1, $2, $3, 'IN_REVERSAL', $4, $5, $6, $7)`,
      [`mov-rev-${Date.now()}`, sale.seller_id, sale.product_id, sale.quantity, saleId, `[ESTORNO] ${reason}`, req.user!.id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Venda estornada! Placa devolvida ao saldo do vendedor.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao estornar venda' });
  } finally {
    client.release();
  }
});

// --- 4. GESTÃO DE VENDEDORES (ADMIN ONLY) ---

// GET /api/users
app.get('/api/users', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, status, monthly_target, low_stock_threshold FROM users ORDER BY name'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// POST /api/users
app.post('/api/users', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, email, phone, monthly_target, low_stock_threshold } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
    return;
  }

  try {
    const defaultPassHash = await bcrypt.hash('vendedor123', 10);
    const userId = `user-${Date.now()}`;

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, status, monthly_target, low_stock_threshold, must_change_password)
       VALUES ($1, $2, $3, $4, $5, 'SELLER', 'ACTIVE', $6, $7, true)`,
      [userId, name, email.trim(), defaultPassHash, phone, monthly_target || 20, low_stock_threshold || 5]
    );

    res.json({ success: true, message: 'Vendedor cadastrado com senha padrão: vendedor123' });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema' });
      return;
    }
    res.status(500).json({ error: 'Erro ao cadastrar vendedor' });
  }
});

// PUT /api/users/:id
app.put('/api/users/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const { name, email, phone, monthly_target, low_stock_threshold, status } = req.body;

  try {
    await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, monthly_target = $4, low_stock_threshold = $5, status = $6, updated_at = NOW() 
       WHERE id = $7`,
      [name, email, phone, monthly_target, low_stock_threshold, status, userId]
    );
    res.json({ success: true, message: 'Dados atualizados com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar vendedor' });
  }
});

// POST /api/users/:id/reset-sessions
app.post('/api/users/:id/reset-sessions', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  try {
    await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
    res.json({ success: true, message: 'Sessões encerradas com sucesso no aparelho do vendedor.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao encerrar sessões' });
  }
});

// --- 5. COMISSÕES ---

// POST /api/commissions/toggle
app.post('/api/commissions/toggle', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { sellerId, referenceMonth, paid } = req.body;
  const status = paid ? 'PAID' : 'PENDING';

  try {
    await pool.query(
      `INSERT INTO commission_statements (id, seller_id, reference_month, status, paid_at, paid_by)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'PAID' THEN NOW() ELSE NULL END, $5)
       ON CONFLICT (seller_id, reference_month) 
       DO UPDATE SET status = $4, paid_at = CASE WHEN $4 = 'PAID' THEN NOW() ELSE NULL END, paid_by = $5`,
      [`comm-${sellerId}-${referenceMonth}`, sellerId, referenceMonth, status, req.user!.id]
    );
    res.json({ success: true, message: `Status de comissão atualizado para ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar comissão' });
  }
});

// --- 6. SERVIÇO DE ARQUIVOS ESTÁTICOS DO DASHBOARD E FRONTEND (SPA FALLBACK) ---
const dashboardDistPath = path.resolve(__dirname, '../../dashboard/dist');
if (fs.existsSync(dashboardDistPath)) {
  app.use('/dashboard', express.static(dashboardDistPath));
  app.get('/dashboard*', (_req: Request, res: Response) => {
    res.sendFile(path.join(dashboardDistPath, 'index.html'));
  });
}

const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Inicialização do Servidor e Banco
async function start() {
  try {
    await initDatabase();
    console.log('[DB] PostgreSQL conectado e tabelas verificadas com sucesso na inicialização.');
  } catch (err: any) {
    console.warn('[AVISO] PostgreSQL ainda não disponível na inicialização:', err.message);
    console.log('[DB] Iniciando rotina de tentativas automáticas de conexão a cada 5 segundos...');
    
    const retryInterval = setInterval(async () => {
      try {
        await initDatabase();
        console.log('[DB] Conectado ao PostgreSQL com sucesso! Tabelas e seeds criados.');
        clearInterval(retryInterval);
      } catch (retryErr: any) {
        console.warn('[DB] Tentando reconectar ao PostgreSQL em 5s... Detalhe:', retryErr.message);
      }
    }, 5000);
  }

  app.listen(PORT, () => {
    console.log(`[API] NFC CONNECT rodando na porta ${PORT}`);
  });
}

start();

