import React, { useState } from 'react';
import type { User, StockSummary, Sale } from '../../types';
import { api } from '../../services/api';
import {
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  PackageCheck,
  CheckCircle,
  XCircle,
  X,
  CreditCard
} from 'lucide-react';

interface SellersPageProps {
  users: User[];
  sales: Sale[];
  stockSummaries: Record<string, StockSummary[]>;
  onRefreshData: () => void;
}

export const SellersPage: React.FC<SellersPageProps> = ({
  users,
  sales,
  stockSummaries,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    monthly_target: number;
    low_stock_threshold: number;
    pix_key: string;
    pix_type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  }>({
    name: '',
    email: '',
    phone: '',
    monthly_target: 20,
    low_stock_threshold: 5,
    pix_key: '',
    pix_type: 'CPF'
  });

  const sellers = users.filter(u => u.role === 'SELLER');

  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      monthly_target: 20,
      low_stock_threshold: 5,
      pix_key: '',
      pix_type: 'CPF'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      monthly_target: user.monthly_target || 20,
      low_stock_threshold: user.low_stock_threshold || 5,
      pix_key: user.pix_key || '',
      pix_type: user.pix_type || 'CPF'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        setFeedback({ message: 'Vendedor atualizado com sucesso!', type: 'success' });
      } else {
        await api.createUser(formData);
        setFeedback({ message: 'Vendedor cadastrado! Senha padrão: vendedor123', type: 'success' });
      }
      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erro ao salvar vendedor', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSessions = async (userId: string, name: string) => {
    if (!window.confirm(`Deseja desconectar e invalidar todas as sessões de ${name}?`)) {
      return;
    }
    try {
      await api.resetUserSessions(userId);
      alert(`Sessões de ${name} encerradas com sucesso.`);
    } catch (err: any) {
      alert(`Erro ao encerrar sessões: ${err.message}`);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Topo com Ações e Busca */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ position: 'relative', minWidth: 300, flex: 1, maxWidth: 420 }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            placeholder="Buscar vendedor por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 40, width: '100%' }}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Cadastrar Novo Vendedor</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabela de Vendedores */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Equipe de Parceiros Comerciais
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {filteredSellers.length} vendedor(es) cadastrado(s) no sistema
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome & Contato</th>
                <th>Status</th>
                <th>Chave Pix</th>
                <th>Placas em Posse</th>
                <th>Vendas Concluídas</th>
                <th>Meta Mensal</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhum vendedor encontrado.
                  </td>
                </tr>
              ) : (
                filteredSellers.map(seller => {
                  const sellerSales = sales.filter(s => s.seller_id === seller.id && s.status === 'ACTIVE');
                  const platesSold = sellerSales.reduce((acc, s) => acc + s.quantity, 0);

                  const summary = stockSummaries[seller.id] || [];
                  const googleStock = summary.find(s => s.productId === 'google')?.availableStock || 0;
                  const instaStock = summary.find(s => s.productId === 'instagram')?.availableStock || 0;
                  const totalInHands = googleStock + instaStock;
                  const hasLowStock = summary.some(s => s.isLowStock);

                  return (
                    <tr key={seller.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>
                          {seller.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                          {seller.email} • {seller.phone || 'Sem WhatsApp'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${seller.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {seller.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{seller.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>
                      <td>
                        {seller.pix_key ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <CreditCard size={13} color="var(--primary-light)" />
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                              {seller.pix_key}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                              ({seller.pix_type || 'PIX'})
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pendente</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: hasLowStock ? '#fbbf24' : 'var(--text-main)' }}>
                            {totalInHands} un.
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            (G: {googleStock} / I: {instaStock})
                          </span>
                          {hasLowStock && (
                            <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: 10 }}>
                              Baixo
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {platesSold} placas
                        </span>
                        <div style={{ fontSize: 11, color: '#34d399' }}>
                          R$ {(platesSold * 90).toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-main)' }}>
                          {seller.monthly_target || 20} placas/mês
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Alerta &le; {seller.low_stock_threshold || 5} un.
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleOpenEdit(seller)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px' }}
                            title="Editar Dados e Pix"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleResetSessions(seller.id, seller.name)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', color: '#f87171' }}
                            title="Desconectar do Celular"
                          >
                            <KeyRound size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Vendedor */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PackageCheck size={20} color="var(--primary-light)" />
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                  {editingUser ? 'Editar Parceiro Comercial' : 'Cadastrar Novo Vendedor'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="carlos@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="(27) 99999-9999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Chave Pix</label>
                  <select
                    value={formData.pix_type}
                    onChange={e => setFormData({ ...formData, pix_type: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chave Pix Oficial para Pagamento</label>
                  <input
                    type="text"
                    value={formData.pix_key}
                    onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                    className="form-input"
                    placeholder="Chave Pix para recebimento de comissões"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Meta Mensal (Placas)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.monthly_target}
                    onChange={e => setFormData({ ...formData, monthly_target: parseInt(e.target.value) || 20 })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta Estoque Baixo</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.low_stock_threshold}
                    onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                    className="form-input"
                  />
                </div>
              </div>

              {!editingUser && (
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', background: 'var(--bg-main)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                  🔑 A senha inicial do vendedor será gerada automaticamente como <strong>vendedor123</strong>. Ele será solicitado a alterar no primeiro login.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? 'Salvando...' : editingUser ? 'Atualizar Vendedor' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
