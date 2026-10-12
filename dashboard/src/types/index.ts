export type UserRole = 'ADMIN' | 'SELLER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  monthly_target: number;
  low_stock_threshold: number;
  pix_key?: string;
  pix_type?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  badge: string;
  sku: string;
  unit_price: number;
  commission_unit: number;
  accent_color: string;
  gradient?: string;
}

export type SaleStatus = 'ACTIVE' | 'CANCELLED';

export interface Sale {
  id: string;
  seller_id: string;
  seller_name?: string;
  product_id: string;
  product_name?: string;
  establishment_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_amount: number;
  payment_method?: 'PIX' | 'DINHEIRO' | 'CARTAO';
  status: SaleStatus;
  sale_date: string;
  nfc_configured: boolean;
  qrcode_tested: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface StockMovement {
  id: string;
  seller_id: string;
  product_id: string;
  type: 'IN_SHIPMENT' | 'OUT_SALE' | 'IN_REVERSAL' | 'CORRECTION';
  quantity: number;
  sale_id?: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface StockSummary {
  productId: string;
  productName: string;
  totalSent: number;
  totalSold: number;
  corrections: number;
  availableStock: number;
  isLowStock: boolean;
}

export interface CommissionStatement {
  id: string;
  seller_id: string;
  seller_name: string;
  pix_key?: string;
  pix_type?: string;
  reference_month: string;
  plates_count: number;
  amount_due: number;
  status: 'PENDING' | 'PAID';
  paid_at?: string;
  paid_by?: string;
}

export interface OverviewMetrics {
  totalBilled: number;
  totalCommissions: number;
  netRevenue: number;
  totalPlatesSold: number;
  activeSellersCount: number;
  pendingCommissionsAmount: number;
  platesGoogle: number;
  platesInstagram: number;
}
