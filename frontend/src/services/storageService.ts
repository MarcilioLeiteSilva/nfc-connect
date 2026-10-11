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
import {
  INITIAL_MOVEMENTS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SUPPORT_MATERIALS,
  INITIAL_USERS
} from '../mock/initialData';

const STORAGE_KEYS = {
  USERS: 'nfc_users_v1',
  PRODUCTS: 'nfc_products_v1',
  MOVEMENTS: 'nfc_movements_v1',
  SALES: 'nfc_sales_v1',
  CURRENT_USER_ID: 'nfc_current_user_id_v1',
  PAID_COMMISSIONS: 'nfc_paid_commissions_v1'
};

class StorageService {
  private users: User[] = [];
  private products: Product[] = [];
  private movements: StockMovement[] = [];
  private sales: Sale[] = [];
  private currentUserId: string = 'user-seller-1'; // Padrão: João Silva (vendedor)
  private paidCommissions: Record<string, boolean> = {}; // key: `sellerId_month`
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS;

      const storedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      this.movements = storedMovements ? JSON.parse(storedMovements) : INITIAL_MOVEMENTS;

      const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
      this.sales = storedSales ? JSON.parse(storedSales) : INITIAL_SALES;

      const storedCurrentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedCurrentUserId) {
        this.currentUserId = storedCurrentUserId;
      }

      const storedPaid = localStorage.getItem(STORAGE_KEYS.PAID_COMMISSIONS);
      if (storedPaid) {
        this.paidCommissions = JSON.parse(storedPaid);
      }
    } catch {
      this.users = INITIAL_USERS;
      this.products = INITIAL_PRODUCTS;
      this.movements = INITIAL_MOVEMENTS;
      this.sales = INITIAL_SALES;
      this.currentUserId = 'user-seller-1';
      this.paidCommissions = {};
    }
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.movements));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(this.sales));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      localStorage.setItem(STORAGE_KEYS.PAID_COMMISSIONS, JSON.stringify(this.paidCommissions));
    } catch (e) {
      console.error('Failed to persist in localStorage', e);
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

  // --- Auth & Users ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    return user || this.users[1];
  }

  public setCurrentUserId(id: string) {
    this.currentUserId = id;
    this.persist();
  }

  public updateUser(user: User) {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
      this.persist();
    }
  }

  public addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`
    };
    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProduct(id: ProductId): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  // --- Support Materials ---
  public getSupportMaterials(): SupportMaterial[] {
    return INITIAL_SUPPORT_MATERIALS;
  }

  // --- Stock & Movements Calculations ---
  public getStockSummary(sellerId: string): SellerStockSummary[] {
    const seller = this.users.find(u => u.id === sellerId);
    const threshold = seller?.low_stock_threshold ?? 5;

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

  // --- Sales ---
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

  public registerSale(params: {
    sellerId: string;
    productId: ProductId;
    establishmentName: string;
    quantity: number;
    nfcConfigured: boolean;
    qrcodeTested: boolean;
    isOffline?: boolean;
  }): { success: boolean; message: string; sale?: Sale } {
    const { sellerId, productId, establishmentName, quantity, nfcConfigured, qrcodeTested, isOffline } = params;

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

    const seller = this.users.find(u => u.id === sellerId);
    const saleId = `sale-${Date.now()}`;
    const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newSale: Sale = {
      id: saleId,
      seller_id: sellerId,
      seller_name: seller?.name || 'Vendedor',
      product_id: productId,
      establishment_name: establishmentName.trim(),
      quantity,
      unit_price: product.unit_price,
      total_price: quantity * product.unit_price,
      commission_amount: quantity * product.commission_unit,
      nfc_configured: true,
      qrcode_tested: true,
      sale_date: now,
      synced_at: isOffline ? undefined : now,
      client_request_id: clientRequestId,
      status: isOffline ? 'PENDING_SYNC' : 'ACTIVE'
    };

    this.sales.unshift(newSale);

    if (!isOffline) {
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
    }

    this.persist();

    return {
      success: true,
      message: isOffline
        ? 'Venda salva no celular! Sincronização automática quando houver sinal.'
        : 'Venda confirmada com sucesso! Estoque atualizado.',
      sale: newSale
    };
  }

  public syncPendingSales(): number {
    let syncedCount = 0;
    const now = new Date().toISOString();

    this.sales = this.sales.map(sale => {
      if (sale.status === 'PENDING_SYNC') {
        const currentStock = this.getAvailableStock(sale.seller_id, sale.product_id);
        if (currentStock >= 0) {
          syncedCount++;
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

          return {
            ...sale,
            status: 'ACTIVE',
            synced_at: now
          };
        } else {
          return {
            ...sale,
            status: 'SYNC_REJECTED'
          };
        }
      }
      return sale;
    });

    if (syncedCount > 0) {
      this.persist();
    }
    return syncedCount;
  }

  public addStockShipment(params: {
    sellerId: string;
    googleQty: number;
    instagramQty: number;
    notes?: string;
  }): boolean {
    const admin = this.getCurrentUser();
    const now = new Date().toISOString();

    if (params.googleQty > 0) {
      this.movements.push({
        id: `mov-${Date.now()}-goog`,
        seller_id: params.sellerId,
        product_id: 'google',
        type: 'IN_SHIPMENT',
        quantity: params.googleQty,
        reason: params.notes || 'Remessa enviada pela administração',
        created_by: admin.id,
        created_at: now
      });
    }

    if (params.instagramQty > 0) {
      this.movements.push({
        id: `mov-${Date.now()}-insta`,
        seller_id: params.sellerId,
        product_id: 'instagram',
        type: 'IN_SHIPMENT',
        quantity: params.instagramQty,
        reason: params.notes || 'Remessa enviada pela administração',
        created_by: admin.id,
        created_at: now
      });
    }

    this.persist();
    return true;
  }

  public correctStock(params: {
    sellerId: string;
    productId: ProductId;
    adjustmentQty: number;
    reason: string;
  }): { success: boolean; message: string } {
    if (!params.reason || params.reason.trim().length < 5) {
      return { success: false, message: 'O motivo detalhado é obrigatório para correções de estoque.' };
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
    return { success: true, message: 'Venda estornada! Placa devolvida ao saldo e comissão anulada.' };
  }

  public isCommissionPaid(sellerId: string, month: string): boolean {
    return !!this.paidCommissions[`${sellerId}_${month}`];
  }

  public setCommissionPaid(sellerId: string, month: string, paid: boolean) {
    this.paidCommissions[`${sellerId}_${month}`] = paid;
    this.persist();
  }

  public getSellerPerformance(sellerId: string): SellerPerformance {
    const seller = this.users.find(u => u.id === sellerId);
    const target = seller?.monthly_target ?? 20;

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
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.PAID_COMMISSIONS);
    this.init();
  }
}

export const storageService = new StorageService();
