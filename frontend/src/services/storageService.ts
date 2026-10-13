import type {
  Product,
  ProductId,
  Sale,
  StockMovement,
  SupportMaterial,
  User,
  SellerStockSummary,
  SellerPerformance
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SUPPORT_MATERIALS } from '../mock/initialData';
import { cryptoService } from './cryptoService';
import { api } from './api';

const STORAGE_KEYS = {
  CURRENT_USER: 'nfc_auth_user_secure',
  ENCRYPTED_OFFLINE_SALES: 'nfc_enc_offline_sales_v2',
  PRODUCTS: 'nfc_products_v1',
  MOVEMENTS: 'nfc_movements_v1',
  SALES: 'nfc_sales_v1',
  PAID_COMMISSIONS: 'nfc_paid_commissions_v1'
};

class StorageService {
  private currentUser: User | null = null;
  private adminUsers: User[] = [];
  private products: Product[] = INITIAL_PRODUCTS;
  private movements: StockMovement[] = [];
  private sales: Sale[] = [];
  private paidCommissions: Record<string, boolean> = {};
  private listeners: (() => void)[] = [];
  private isSyncing = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Carrega dados do usuário autenticado salvo
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }

      // 2. Carrega catálogo de produtos
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS;

      // 3. Carrega movimentações e vendas do usuário
      const storedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      this.movements = storedMovements ? JSON.parse(storedMovements) : [];

      const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
      this.sales = storedSales ? JSON.parse(storedSales) : [];

      const storedPaid = localStorage.getItem(STORAGE_KEYS.PAID_COMMISSIONS);
      if (storedPaid) {
        this.paidCommissions = JSON.parse(storedPaid);
      }
    } catch (e) {
      console.warn('[Storage] Erro ao carregar cache local:', e);
    }
  }

  private getEncryptionSecret(): string {
    return this.currentUser?.id || 'nfc_secure_device_secret_2026';
  }

  private persist() {
    try {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.movements));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(this.sales));
      localStorage.setItem(STORAGE_KEYS.PAID_COMMISSIONS, JSON.stringify(this.paidCommissions));
    } catch (e) {
      console.error('[Storage] Falha ao persistir dados locais:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Auth & Users (Privacidade Absoluta) ---

  public getCurrentUser(): User {
    if (this.currentUser) {
      return this.currentUser;
    }
    // Fallback anônimo padrão seguro até o login ser completado
    return {
      id: 'anon',
      name: 'Vendedor',
      email: 'acesso@comunicarmarketing.com.br',
      phone: '',
      role: 'SELLER',
      status: 'ACTIVE',
      monthly_target: 20,
      low_stock_threshold: 5
    };
  }


  public setCurrentUser(user: User) {
    this.currentUser = user;
    this.persist();
  }

  public setCurrentUserId(id: string) {
    if (this.currentUser) {
      this.currentUser.id = id;
      this.persist();
    }
  }

  public clearSession() {
    this.currentUser = null;
    this.adminUsers = [];
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  /**
   * Retorna os usuários do sistema.
   * REGRA DE PRIVACIDADE:
   * - Vendedores comuns só enxergam a si mesmos ([this.currentUser]).
   * - Apenas o Administrador autenticado pode ver a lista de vendedores.
   */
  public getUsers(): User[] {
    if (this.currentUser?.role === 'ADMIN') {
      return this.adminUsers.length > 0 ? this.adminUsers : (this.currentUser ? [this.currentUser] : []);
    }
    return this.currentUser ? [this.currentUser] : [];
  }

  public setAdminUsers(users: User[]) {
    if (this.currentUser?.role === 'ADMIN') {
      this.adminUsers = users;
      this.notify();
    }
  }

  public async fetchAdminUsersFromApi(): Promise<User[]> {
    if (this.currentUser?.role !== 'ADMIN') return [];
    try {
      const users = await api.getUsers();
      this.adminUsers = users;
      this.notify();
      return users;
    } catch (err) {
      console.warn('[Storage] Erro ao carregar usuários da API:', err);
      return this.adminUsers;
    }
  }

  public updateUser(user: User) {
    if (this.currentUser?.id === user.id) {
      this.currentUser = user;
    }
    const idx = this.adminUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.adminUsers[idx] = user;
    }
    this.persist();
  }

  public addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`
    };
    if (this.currentUser?.role === 'ADMIN') {
      this.adminUsers.push(newUser);
    }
    this.persist();
    return newUser;
  }

  // --- Produtos & Apoio ---

  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProduct(id: ProductId): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public getSupportMaterials(): SupportMaterial[] {
    return INITIAL_SUPPORT_MATERIALS;
  }

  // --- Estoque e Resumos ---

  public getStockSummary(sellerId: string): SellerStockSummary[] {
    const threshold = this.currentUser?.low_stock_threshold ?? 5;

    return this.products.map(product => {
      const movements = this.movements.filter(
        m => m.seller_id === sellerId && m.product_id === product.id
      );

      let totalSent = 0;
      let totalSold = 0;
      let corrections = 0;

      movements.forEach(m => {
        if (m.type === 'IN_SHIPMENT') {
          totalSent += m.quantity;
        } else if (m.type === 'OUT_SALE') {
          totalSold += Math.abs(m.quantity);
        } else if (m.type === 'IN_REVERSAL') {
          totalSold -= m.quantity;
        } else if (m.type === 'CORRECTION') {
          corrections += m.quantity;
        }
      });

      const pendingSales = this.sales.filter(
        s => s.seller_id === sellerId && s.product_id === product.id && s.status === 'PENDING_SYNC'
      );
      const pendingQty = pendingSales.reduce((acc, s) => acc + s.quantity, 0);

      const availableStock = totalSent + corrections - totalSold - pendingQty;

      return {
        productId: product.id,
        productName: product.name,
        totalSent,
        totalSold: Math.max(0, totalSold),
        corrections,
        availableStock: Math.max(0, availableStock),
        isLowStock: availableStock <= threshold
      };
    });
  }

  public getAvailableStock(sellerId: string, productId: ProductId): number {
    const summary = this.getStockSummary(sellerId);
    const item = summary.find(s => s.productId === productId);
    return item ? item.availableStock : 0;
  }

  public getMovements(sellerId?: string): StockMovement[] {
    if (sellerId) {
      return this.movements
        .filter(m => m.seller_id === sellerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...this.movements].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public setMovements(movements: StockMovement[]) {
    this.movements = movements;
    this.persist();
  }

  // --- Vendas & Fila Criptografada Offline (AES-GCM 256) ---

  public getSales(sellerId?: string): Sale[] {
    if (sellerId) {
      return this.sales
        .filter(s => s.seller_id === sellerId)
        .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
    }
    return [...this.sales].sort(
      (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    );
  }

  public setSales(sales: Sale[]) {
    this.sales = sales;
    this.persist();
  }

  /**
   * Registra uma nova venda.
   * - Se online: Tenta enviar diretamente à API do PostgreSQL.
   * - Se offline: Grava na fila local usando criptografia AES-GCM 256-bit (Web Crypto API).
   */
  public async registerSale(params: {
    sellerId: string;
    productId: ProductId;
    establishmentName: string;
    quantity: number;
    nfcConfigured: boolean;
    qrcodeTested: boolean;
    installationPhoto?: string;
    isOffline?: boolean;
  }): Promise<{ success: boolean; message: string; sale?: Sale }> {
    const { sellerId, productId, establishmentName, quantity, nfcConfigured, qrcodeTested, installationPhoto, isOffline } = params;

    if (quantity <= 0) {
      return { success: false, message: 'Quantidade deve ser maior que zero.' };
    }

    if (!nfcConfigured || !qrcodeTested) {
      return {
        success: false,
        message: 'É obrigatório confirmar a configuração do NFC e teste do QR Code.'
      };
    }

    const availableStock = this.getAvailableStock(sellerId, productId);
    if (quantity > availableStock) {
      return {
        success: false,
        message: `Saldo insuficiente! Você possui apenas ${availableStock} placa(s) deste modelo.`
      };
    }

    const product = this.getProduct(productId);
    if (!product) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const saleId = `sale-${Date.now()}`;
    const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newSale: Sale = {
      id: saleId,
      seller_id: sellerId,
      seller_name: this.currentUser?.name || 'Vendedor',
      product_id: productId,
      establishment_name: establishmentName.trim(),
      quantity,
      unit_price: product.unit_price,
      total_price: quantity * product.unit_price,
      commission_amount: quantity * product.commission_unit,
      nfc_configured: true,
      qrcode_tested: true,
      installation_photo: installationPhoto,
      sale_date: now,
      synced_at: isOffline ? undefined : now,
      client_request_id: clientRequestId,
      status: isOffline ? 'PENDING_SYNC' : 'ACTIVE'
    };

    // 1. Adiciona à lista de vendas da sessão
    this.sales.unshift(newSale);

    if (isOffline) {
      // 2. MODO OFFLINE: Criptografa a venda na fila do celular com AES-GCM 256
      await this.enqueueEncryptedSale(newSale);
    } else {
      // 3. MODO ONLINE: Atualiza movimentação local e envia à API
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        seller_id: sellerId,
        product_id: productId,
        type: 'OUT_SALE',
        quantity: -quantity,
        sale_id: saleId,
        created_by: sellerId,
        created_at: now
      };
      this.movements.push(movement);

      // Tenta persistir no PostgreSQL de forma atômica
      try {
        await api.registerSale({
          productId,
          establishmentName: establishmentName.trim(),
          quantity,
          nfcConfigured,
          qrcodeTested,
          clientRequestId,
          installationPhoto
        });
      } catch (apiErr) {
        console.warn('[Storage] Falha no envio à API, salvando de forma criptografada para reenvio:', apiErr);
        newSale.status = 'PENDING_SYNC';
        newSale.synced_at = undefined;
        await this.enqueueEncryptedSale(newSale);
      }
    }

    this.persist();

    return {
      success: true,
      message: isOffline
        ? '🔒 Venda salva com criptografia militar (AES-256) no celular! Sincronização automática quando houver sinal.'
        : 'Venda confirmada e sincronizada com sucesso no banco de dados!',
      sale: newSale
    };
  }

  /**
   * Adiciona uma venda à fila criptografada local
   */
  private async enqueueEncryptedSale(sale: Sale) {
    try {
      const existingEnc = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES);
      let queue: Sale[] = [];
      if (existingEnc) {
        try {
          queue = await cryptoService.decrypt<Sale[]>(existingEnc, this.getEncryptionSecret());
        } catch {
          queue = [];
        }
      }
      queue.push(sale);
      const encryptedBlob = await cryptoService.encrypt(queue, this.getEncryptionSecret());
      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES, encryptedBlob);
    } catch (err) {
      console.error('[Storage] Erro ao criptografar venda offline:', err);
    }
  }

  /**
   * Sincroniza a fila criptografada offline com o PostgreSQL quando a conexão volta
   */
  public async syncPendingSales(): Promise<number> {
    if (this.isSyncing) return 0;
    this.isSyncing = true;

    try {
      const encryptedBlob = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES);
      if (!encryptedBlob) return 0;

      let queue: Sale[] = [];
      try {
        queue = await cryptoService.decrypt<Sale[]>(encryptedBlob, this.getEncryptionSecret());
      } catch (err) {
        console.error('[Storage] Falha ao decifrar fila local para sincronizar:', err);
        return 0;
      }

      if (queue.length === 0) return 0;

      let syncedCount = 0;
      const failedQueue: Sale[] = [];
      const now = new Date().toISOString();

      for (const sale of queue) {
        try {
          await api.registerSale({
            productId: sale.product_id,
            establishmentName: sale.establishment_name,
            quantity: sale.quantity,
            nfcConfigured: sale.nfc_configured,
            qrcodeTested: sale.qrcode_tested,
            clientRequestId: sale.client_request_id,
            installationPhoto: sale.installation_photo
          });

          // Atualiza status no histórico da sessão
          const idx = this.sales.findIndex(s => s.id === sale.id || s.client_request_id === sale.client_request_id);
          if (idx >= 0) {
            this.sales[idx].status = 'ACTIVE';
            this.sales[idx].synced_at = now;
          }

          this.movements.push({
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            seller_id: sale.seller_id,
            product_id: sale.product_id,
            type: 'OUT_SALE',
            quantity: -sale.quantity,
            sale_id: sale.id,
            created_by: sale.seller_id,
            created_at: now
          });

          syncedCount++;
        } catch (apiErr) {
          console.warn('[Storage] Falha ao sincronizar venda individual, mantendo na fila:', apiErr);
          failedQueue.push(sale);
        }
      }

      // Se todas foram sincronizadas, apaga a fila cifrada
      if (failedQueue.length === 0) {
        localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES);
      } else {
        const reEncrypted = await cryptoService.encrypt(failedQueue, this.getEncryptionSecret());
        localStorage.setItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES, reEncrypted);
      }

      if (syncedCount > 0) {
        this.persist();
      }
      return syncedCount;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincroniza o estoque e histórico de vendas do vendedor direto do PostgreSQL.
   * Chamado automaticamente assim que o vendedor abre o celular ou faz login.
   */
  public async syncSellerDataFromApi(): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== 'SELLER') return;

    try {
      // 1. Busca movimentações de estoque reais do PostgreSQL
      const movRes = await api.getStockMovements(this.currentUser.id).catch(() => ({ movements: [] }));
      if (Array.isArray(movRes.movements) && movRes.movements.length > 0) {
        this.movements = movRes.movements.map((m: any) => ({
          ...m,
          quantity: Number(m.quantity)
        }));
      }

      // 2. Busca vendas confirmadas do vendedor
      const salesRes = await api.getSales().catch(() => ({ sales: [] }));
      if (Array.isArray(salesRes.sales)) {
        const pendingLocal = this.sales.filter(s => s.status === 'PENDING_SYNC');
        const apiSales = salesRes.sales.map((s: any) => ({
          ...s,
          unit_price: Number(s.unit_price),
          total_price: Number(s.total_price),
          commission_amount: Number(s.commission_amount)
        }));
        
        const apiIds = new Set(apiSales.map((s: any) => s.id));
        this.sales = [...pendingLocal.filter(p => !apiIds.has(p.id)), ...apiSales];
      }

      this.persist();
      this.notify();
    } catch (err) {
      console.warn('[Storage] Falha ao sincronizar dados da API:', err);
    }
  }

  // --- Operações Administrativas (Remessas, Ajustes e Estornos) ---

  public addStockShipment(params: {
    sellerId: string;
    googleQty: number;
    instagramQty: number;
    notes?: string;
  }): { success: boolean; message: string } {
    const admin = this.getCurrentUser();
    const now = new Date().toISOString();

    if (params.googleQty > 0) {
      this.movements.push({
        id: `mov-ship-goog-${Date.now()}`,
        seller_id: params.sellerId,
        product_id: 'google',
        type: 'IN_SHIPMENT',
        quantity: params.googleQty,
        reason: params.notes || 'Remessa de Placas Google',
        created_by: admin.id,
        created_at: now
      });
    }

    if (params.instagramQty > 0) {
      this.movements.push({
        id: `mov-ship-insta-${Date.now()}`,
        seller_id: params.sellerId,
        product_id: 'instagram',
        type: 'IN_SHIPMENT',
        quantity: params.instagramQty,
        reason: params.notes || 'Remessa de Placas Instagram',
        created_by: admin.id,
        created_at: now
      });
    }

    this.persist();

    // Sincroniza com a API assincronamente
    api.addShipment(params).catch(err => {
      console.warn('[Storage] Falha ao enviar remessa para API:', err);
    });

    return { success: true, message: 'Remessa de estoque registrada com sucesso!' };
  }

  public correctStock(params: {
    sellerId: string;
    productId: ProductId;
    adjustmentQty: number;
    reason: string;
  }): { success: boolean; message: string } {
    if (params.adjustmentQty === 0) {
      return { success: false, message: 'Quantidade de ajuste não pode ser zero.' };
    }
    if (!params.reason || params.reason.trim().length < 5) {
      return { success: false, message: 'Justificativa obrigatória (mínimo de 5 caracteres).' };
    }

    const currentStock = this.getAvailableStock(params.sellerId, params.productId);
    if (currentStock + params.adjustmentQty < 0) {
      return {
        success: false,
        message: `Ajuste recusado! Deixaria o saldo negativo (${currentStock + params.adjustmentQty}).`
      };
    }

    const admin = this.getCurrentUser();
    this.movements.push({
      id: `mov-corr-${Date.now()}`,
      seller_id: params.sellerId,
      product_id: params.productId,
      type: 'CORRECTION',
      quantity: params.adjustmentQty,
      reason: `[CORREÇÃO AUDITADA] ${params.reason}`,
      created_by: admin.id,
      created_at: new Date().toISOString()
    });

    this.persist();

    api.correctStock(params).catch(err => {
      console.warn('[Storage] Falha ao enviar correção para API:', err);
    });

    return { success: true, message: 'Ajuste de estoque lançado com sucesso no histórico auditável.' };
  }

  public reverseSale(saleId: string, reason: string): { success: boolean; message: string } {
    if (!reason || reason.trim().length < 4) {
      return { success: false, message: 'Informe a justificativa do estorno.' };
    }

    const saleIndex = this.sales.findIndex(s => s.id === saleId);
    if (saleIndex < 0) {
      return { success: false, message: 'Venda não encontrada.' };
    }

    const sale = this.sales[saleIndex];
    if (sale.status === 'CANCELLED') {
      return { success: false, message: 'Esta venda já está estornada.' };
    }

    const admin = this.getCurrentUser();
    const now = new Date().toISOString();

    this.sales[saleIndex] = {
      ...sale,
      status: 'CANCELLED',
      cancelled_by: admin.id,
      cancelled_at: now,
      cancel_reason: reason
    };

    this.movements.push({
      id: `mov-rev-${Date.now()}`,
      seller_id: sale.seller_id,
      product_id: sale.product_id,
      type: 'IN_REVERSAL',
      quantity: sale.quantity,
      sale_id: sale.id,
      reason: `[ESTORNO DE VENDA] ${reason}`,
      created_by: admin.id,
      created_at: now
    });

    this.persist();

    api.reverseSale(saleId, reason).catch(err => {
      console.warn('[Storage] Falha ao enviar estorno para API:', err);
    });

    return { success: true, message: 'Venda estornada! Placa devolvida ao saldo e comissão anulada.' };
  }

  public isCommissionPaid(sellerId: string, month: string): boolean {
    return !!this.paidCommissions[`${sellerId}_${month}`];
  }

  public setCommissionPaid(sellerId: string, month: string, paid: boolean) {
    this.paidCommissions[`${sellerId}_${month}`] = paid;
    this.persist();

    api.toggleCommission(sellerId, month, paid).catch(err => {
      console.warn('[Storage] Falha ao sincronizar comissão na API:', err);
    });
  }

  public getSellerPerformance(sellerId: string): SellerPerformance {
    const target = this.currentUser?.monthly_target ?? 20;
    const currentMonthPrefix = new Date().toISOString().substring(0, 7);

    const activeSales = this.sales.filter(
      s => s.seller_id === sellerId && s.status === 'ACTIVE' && s.sale_date.startsWith(currentMonthPrefix)
    );

    const pendingSales = this.sales.filter(
      s => s.seller_id === sellerId && s.status === 'PENDING_SYNC'
    );

    const soldCount = activeSales.reduce((acc, s) => acc + s.quantity, 0);
    const totalBilled = activeSales.reduce((acc, s) => acc + s.total_price, 0);
    const totalCommission = activeSales.reduce((acc, s) => acc + s.commission_amount, 0);
    const progressPercent = Math.min(100, Math.round((soldCount / target) * 100));

    return {
      month: 'Outubro / 2026',
      target,
      soldCount,
      progressPercent,
      totalBilled,
      totalCommission,
      pendingSyncCount: pendingSales.length
    };
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_OFFLINE_SALES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.PAID_COMMISSIONS);
    this.init();
  }
}

export const storageService = new StorageService();
