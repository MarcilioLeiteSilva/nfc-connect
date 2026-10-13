import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns/promises';

dotenv.config();

const { Pool } = pg;

// Configuração do PostgreSQL para a rede interna do EasyPanel
function parseDbConfig() {
  const rawUrl = process.env.DATABASE_URL || '';
  
  // Extrai componentes mesmo se a senha contiver caracteres especiais como @ ou #
  const match = rawUrl.match(/^(?:postgres(?:ql)?:\/\/)([^:]+):(.+)@([^@/:]+)(?::(\d+))?\/([^?]+)/);
  if (match) {
    const [, user, pass, host, port, database] = match;
    let finalPass = pass.trim();
    try {
      finalPass = decodeURIComponent(finalPass);
    } catch {
      // se não estiver encodado, mantém a senha original
    }
    return {
      host: host.trim(),
      port: port ? parseInt(port, 10) : 5432,
      user: user.trim(),
      password: finalPass,
      database: database.trim()
    };
  }


  // Endereço oficial confirmado do EasyPanel
  return {
    host: 'nfc-connect_nfc-postgres',
    port: 5432,
    user: 'postgres',
    password: 'Cascavel@#01',
    database: 'nfc-connect'
  };
}

let dbConfig = parseDbConfig();

export let pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: false
});

export let isDatabaseInitialized = false;

/**
 * Tenta resolver automaticamente o hostname correto do PostgreSQL na rede Docker
 */
async function autoDetectHost(): Promise<boolean> {
  const candidateHosts = [
    dbConfig.host,
    'nfc-connect_nfc-postgres',
    'nfc-postgres',
    'Postgres',
    'postgres',
    'database',
    'db'
  ];

  for (const host of candidateHosts) {
    try {
      await dns.lookup(host);
      console.log(`[DB] ✅ Host do PostgreSQL encontrado na rede interna: "${host}"`);
      if (dbConfig.host !== host) {
        dbConfig.host = host;
        await pool.end().catch(() => {});
        pool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.database,
          ssl: false
        });
      }
      return true;
    } catch {
      // Continua testando
    }
  }
  return false;
}


/**
 * Cria o banco 'nfc-connect' no PostgreSQL caso ainda não exista no servidor
 */
async function ensureDatabaseExists() {
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres',
    ssl: false
  });


  try {
    const client = await adminPool.connect();
    try {
      const checkRes = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'nfc-connect'`);
      if (checkRes.rows.length === 0) {
        console.log('[DB] Banco "nfc-connect" não encontrado. Criando automaticamente...');
        await client.query(`CREATE DATABASE "nfc-connect"`);
        console.log('[DB] Banco "nfc-connect" criado com sucesso!');
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[DB] Verificação de banco mestre "postgres" ignorada:', (err as any).message);
  } finally {
    await adminPool.end().catch(() => {});
  }
}


/**
 * Inicialização e Migração Automática de Tabelas (ACID)
 */
export async function initDatabase() {
  let client;
  try {
    client = await pool.connect();
  } catch (connectErr: any) {
    // Se o hostname falhar (ENOTFOUND), tenta resolver outros nomes de serviço Docker
    if (connectErr.code === 'ENOTFOUND') {
      const detected = await autoDetectHost();
      if (detected) {
        try {
          client = await pool.connect();
        } catch (retryErr: any) {
          if (retryErr.code === '3D000') {
            await ensureDatabaseExists();
            client = await pool.connect();
          } else {
            throw retryErr;
          }
        }
      } else {
        throw connectErr;
      }
    } else if (connectErr.code === '3D000') {
      // Se o banco nfc-connect ainda não existir (código 3D000), tenta criá-lo
      await ensureDatabaseExists();
      client = await pool.connect();
    } else {
      throw connectErr;
    }
  }


  try {
    console.log('[DB] Conectado ao PostgreSQL. Verificando e criando tabelas...');


    await client.query(`
      -- 1. Usuários (Admin e Vendedores)
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'SELLER', -- 'ADMIN' ou 'SELLER'
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' ou 'INACTIVE'
        monthly_target INT NOT NULL DEFAULT 20,
        low_stock_threshold INT NOT NULL DEFAULT 5,
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        token_version INT NOT NULL DEFAULT 0,
        consent_accepted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- 2. Produtos
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, -- 'google', 'instagram'
        name VARCHAR(255) NOT NULL,
        badge VARCHAR(255),
        sku VARCHAR(50) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 90.00,
        commission_unit DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      -- 3. Remessas de Estoque enviadas pelo Admin
      CREATE TABLE IF NOT EXISTS stock_shipments (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(50) REFERENCES products(id),
        quantity INT NOT NULL,
        shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_by VARCHAR(64) REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- 4. Movimentações de Estoque (Fonte Única da Verdade - Append Only)
      CREATE TABLE IF NOT EXISTS stock_movements (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(50) REFERENCES products(id),
        type VARCHAR(30) NOT NULL, -- 'IN_SHIPMENT', 'OUT_SALE', 'IN_REVERSAL', 'CORRECTION'
        quantity INT NOT NULL, -- com sinal (+ entrada, - saída)
        sale_id VARCHAR(64),
        reason TEXT,
        created_by VARCHAR(64) REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- 5. Vendas
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(50) REFERENCES products(id),
        establishment_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 90.00,
        total_price DECIMAL(10, 2) NOT NULL DEFAULT 90.00,
        commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
        nfc_configured BOOLEAN NOT NULL DEFAULT true,
        qrcode_tested BOOLEAN NOT NULL DEFAULT true,
        sale_date TIMESTAMP NOT NULL DEFAULT NOW(),
        synced_at TIMESTAMP DEFAULT NOW(),
        client_request_id VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CANCELLED', 'SYNC_REJECTED'
        cancelled_by VARCHAR(64) REFERENCES users(id),
        cancelled_at TIMESTAMP,
        cancel_reason TEXT
      );

      -- 6. Apuração de Comissões
      CREATE TABLE IF NOT EXISTS commission_statements (
        id VARCHAR(64) PRIMARY KEY,
        seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        reference_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID'
        paid_at TIMESTAMP,
        paid_by VARCHAR(64) REFERENCES users(id),
        UNIQUE (seller_id, reference_month)
      );

      -- Migrações incrementais de esquema
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_type VARCHAR(20) DEFAULT 'CPF';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_proof_photo TEXT;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS installation_photo TEXT;
      ALTER TABLE commission_statements ADD COLUMN IF NOT EXISTS payment_receipt TEXT;
    `);

    // Inserir Catálogo de Produtos padrão se vazio
    await client.query(`
      INSERT INTO products (id, name, badge, sku, unit_price, commission_unit)
      VALUES 
        ('google', 'Placa NFC Google', 'Avaliações 5 Estrelas', 'NFC-GOOG-01', 90.00, 20.00),
        ('instagram', 'Placa NFC Instagram', 'Seguidores & Direct', 'NFC-INSTA-01', 90.00, 20.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Inserir Usuários Iniciais se não existirem
    const adminCheck = await client.query(`SELECT id FROM users WHERE email = 'admin@comunicarmarketing.com.br'`);
    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash('Cascavel@#01', 10);
      const sellerHash = await bcrypt.hash('vendedor123', 10);

      // Admin Geral
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, phone, role, status, monthly_target, must_change_password)
        VALUES ('user-admin', 'Carlos Gestor', 'admin@comunicarmarketing.com.br', $1, '(11) 98765-4321', 'ADMIN', 'ACTIVE', 100, false)
      `, [adminHash]);

      // Vendedor 1 (João Silva)
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, phone, role, status, monthly_target, low_stock_threshold, must_change_password)
        VALUES ('user-seller-1', 'João Silva', 'joao.silva@comunicarmarketing.com.br', $1, '(11) 99123-4567', 'SELLER', 'ACTIVE', 20, 5, false)
      `, [sellerHash]);

      // Vendedor 2 (Mariana Costa)
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, phone, role, status, monthly_target, low_stock_threshold, must_change_password)
        VALUES ('user-seller-2', 'Mariana Costa', 'mariana.costa@comunicarmarketing.com.br', $1, '(11) 98234-5678', 'SELLER', 'ACTIVE', 25, 5, false)
      `, [sellerHash]);

      // Vendedor 3 (Lucas Oliveira)
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, phone, role, status, monthly_target, low_stock_threshold, must_change_password)
        VALUES ('user-seller-3', 'Lucas Oliveira', 'lucas.oliveira@comunicarmarketing.com.br', $1, '(11) 97345-6789', 'SELLER', 'ACTIVE', 20, 4, false)
      `, [sellerHash]);

      // Remessa inicial de estoque para João Silva
      await client.query(`
        INSERT INTO stock_movements (id, seller_id, product_id, type, quantity, reason, created_by)
        VALUES 
          ('mov-seed-1', 'user-seller-1', 'google', 'IN_SHIPMENT', 25, 'Remessa Inicial Outubro', 'user-admin'),
          ('mov-seed-2', 'user-seller-1', 'instagram', 'IN_SHIPMENT', 20, 'Remessa Inicial Outubro', 'user-admin'),
          ('mov-seed-3', 'user-seller-2', 'google', 'IN_SHIPMENT', 15, 'Remessa Inicial Outubro', 'user-admin'),
          ('mov-seed-4', 'user-seller-2', 'instagram', 'IN_SHIPMENT', 6, 'Remessa Inicial Outubro', 'user-admin')
      `);

      console.log('[DB] Banco populado com usuários e estoque inicial da Comunicar Marketing.');
    }

    isDatabaseInitialized = true;
    console.log('[DB] Migração e estrutura do banco aprovadas com sucesso.');
  } catch (err) {
    isDatabaseInitialized = false;
    console.error('[DB] Erro ao inicializar tabelas:', err);
    throw err;
  } finally {
    client?.release();
  }
}

/**
 * Garante que a migração foi executada pelo menos uma vez
 */
export async function ensureDatabase(): Promise<boolean> {
  if (isDatabaseInitialized) return true;
  try {
    await initDatabase();
    return true;
  } catch (err) {
    return false;
  }
}

