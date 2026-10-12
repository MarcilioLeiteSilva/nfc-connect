import type { User, Sale, StockSummary } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nfc_admin_token') || localStorage.getItem('nfc_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('nfc_admin_token', token);
  } else {
    localStorage.removeItem('nfc_admin_token');
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data as T;
}

export const api = {
  // Autenticação
  login: async (email: string, password: string) => {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(res.token);
    return res;
  },

  getMe: () => request<{ user: User }>('/auth/me'),

  logout: () => {
    setAuthToken(null);
  },

  // Usuários / Vendedores
  getUsers: () => request<{ users: User[] }>('/users'),

  createUser: (userData: {
    name: string;
    email: string;
    phone?: string;
    monthly_target?: number;
    low_stock_threshold?: number;
    pix_key?: string;
    pix_type?: string;
  }) =>
    request<{ success: boolean; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  updateUser: (
    userId: string,
    userData: Partial<User>
  ) =>
    request<{ success: boolean; message: string }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  resetUserSessions: (userId: string) =>
    request<{ success: boolean; message: string }>(`/users/${userId}/reset-sessions`, {
      method: 'POST'
    }),

  // Vendas
  getSales: () => request<{ sales: Sale[] }>('/sales'),

  reverseSale: (saleId: string, reason: string) =>
    request<{ success: boolean; message: string }>(`/sales/${saleId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Estoque
  getStockSummary: (sellerId?: string) =>
    request<{ summary?: StockSummary[]; summaries?: StockSummary[] }>(`/stock/summary${sellerId ? `?sellerId=${sellerId}` : ''}`),

  sendStockShipment: (sellerId: string, productId: string, quantity: number, notes?: string) =>
    request<{ success: boolean; message: string }>('/stock/shipment', {
      method: 'POST',
      body: JSON.stringify({ sellerId, productId, quantity, notes })
    }),

  // Comissões
  toggleCommission: (sellerId: string, referenceMonth: string, paid: boolean) =>
    request<{ success: boolean; message: string }>('/commissions/toggle', {
      method: 'POST',
      body: JSON.stringify({ sellerId, referenceMonth, paid })
    })
};
