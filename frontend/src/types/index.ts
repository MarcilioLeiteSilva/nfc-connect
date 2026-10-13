export type UserRole = 'ADMIN' | 'SELLER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  monthly_target: number; // default 20
  low_stock_threshold: number; // default 5
  avatar_url?: string;
  pix_key?: string;
  pix_type?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pix_proof_photo?: string;
}

export type ProductId = 'google' | 'instagram';

export interface Product {
  id: ProductId;
  name: string;
  badge: string;
  sku: string;
  unit_price: number; // R$ 90,00
  commission_unit: number; // R$ 20,00
  accent_color: string;
  gradient: string;
  icon: string;
}

export type StockMovementType = 'IN_SHIPMENT' | 'OUT_SALE' | 'IN_REVERSAL' | 'CORRECTION';

export interface StockMovement {
  id: string;
  seller_id: string;
  product_id: ProductId;
  type: StockMovementType;
  quantity: number; // com sinal (+ entrada, - saída)
  shipment_id?: string;
  sale_id?: string;
  reason?: string; // Obrigatório em CORRECTION ou estorno
  created_by: string;
  created_at: string;
}

export interface StockShipment {
  id: string;
  seller_id: string;
  product_id: ProductId;
  quantity: number;
  shipment_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export type SaleStatus = 'ACTIVE' | 'CANCELLED' | 'PENDING_SYNC' | 'SYNC_REJECTED';

export interface Sale {
  id: string;
  seller_id: string;
  seller_name?: string;
  product_id: ProductId;
  establishment_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_amount: number;
  nfc_configured: boolean;
  qrcode_tested: boolean;
  sale_date: string;
  synced_at?: string;
  client_request_id: string;
  status: SaleStatus;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  installation_photo?: string;
}

export interface SupportMaterial {
  id: string;
  code: string;
  title: string;
  category: 'Treinamento' | 'Vendas' | 'Técnico' | 'Apresentação';
  description: string;
  readTime: string;
  url?: string;
  summary: string;
  keyPoints: string[];
}

export interface SellerStockSummary {
  productId: ProductId;
  productName: string;
  totalSent: number;
  totalSold: number;
  corrections: number;
  availableStock: number;
  isLowStock: boolean;
}

export interface SellerPerformance {
  month: string;
  target: number;
  soldCount: number;
  progressPercent: number;
  totalBilled: number;
  totalCommission: number;
  pendingSyncCount: number;
}
