// Cliente de API HTTP para NFC CONNECT

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nfc_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('nfc_jwt_token', token);
  } else {
    localStorage.removeItem('nfc_jwt_token');
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
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

  return data;
}

export const api = {
  // Autenticação
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request('/auth/me'),

  changePassword: (newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  // Estoque
  getStockSummary: (sellerId?: string) =>
    request(`/stock/summary${sellerId ? `?sellerId=${sellerId}` : ''}`),

  getStockMovements: (sellerId?: string) =>
    request(`/stock/movements${sellerId ? `?sellerId=${sellerId}` : ''}`),

  addShipment: (params: { sellerId: string; googleQty: number; instagramQty: number; notes?: string }) =>
    request('/stock/shipment', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  correctStock: (params: { sellerId: string; productId: string; adjustmentQty: number; reason: string }) =>
    request('/stock/correction', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Vendas
  getSales: () => request('/sales'),

  registerSale: (params: {
    productId: string;
    establishmentName: string;
    quantity: number;
    nfcConfigured: boolean;
    qrcodeTested: boolean;
    clientRequestId?: string;
  }) =>
    request('/sales', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  reverseSale: (saleId: string, reason: string) =>
    request(`/sales/${saleId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Usuários (Admin)
  getUsers: () => request('/users'),

  createUser: (params: any) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  updateUser: (id: string, params: any) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params)
    }),

  resetSessions: (id: string) =>
    request(`/users/${id}/reset-sessions`, {
      method: 'POST'
    }),

  // Comissões
  toggleCommission: (sellerId: string, referenceMonth: string, paid: boolean) =>
    request('/commissions/toggle', {
      method: 'POST',
      body: JSON.stringify({ sellerId, referenceMonth, paid })
    })
};
