import React from 'react';
import { storageService } from '../../services/storageService';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  Plus,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const users = storageService.getUsers().filter(u => u.role === 'SELLER');
  const allSales = storageService.getSales();
  const activeSales = allSales.filter(s => s.status === 'ACTIVE');

  const totalBilled = activeSales.reduce((acc, s) => acc + s.total_price, 0);
  const totalCommission = activeSales.reduce((acc, s) => acc + s.commission_amount, 0);
  const totalPlatesSold = activeSales.reduce((acc, s) => acc + s.quantity, 0);

  // Vendedores com estoque baixo
  const sellersWithLowStock = users.filter(seller => {
    const summary = storageService.getStockSummary(seller.id);
    return summary.some(s => s.isLowStock);
  });

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Comunicar Marketing
          </span>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Painel Executivo</h1>
        </div>
        <div className="badge badge-info" style={{ gap: 4 }}>
          <ShieldCheck size={12} />
          <span>Gestão Global</span>
        </div>
      </div>

      {/* Métricas Globais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="metric-card metric-card-highlight">
          <div className="metric-card-header">
            <span className="metric-card-title">FATURAMENTO TOTAL</span>
            <TrendingUp size={16} color="#38bdf8" />
          </div>
          <span className="metric-card-value" style={{ fontSize: 24 }}>
            R$ {totalBilled.toFixed(2).replace('.', ',')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {totalPlatesSold} placas ativadas
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">COMISSÕES GERADAS</span>
            <DollarSign size={16} color="#10b981" />
          </div>
          <span className="metric-card-value" style={{ color: '#34d399', fontSize: 24 }}>
            R$ {totalCommission.toFixed(2).replace('.', ',')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            R$ 20,00 por placa
          </span>
        </div>
      </div>

      {/* Alerta de Estoque Crítico na Equipe */}
      {sellersWithLowStock.length > 0 && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <strong style={{ color: '#fbbf24', fontSize: 13 }}>
                {sellersWithLowStock.length} Vendedor(es) com Estoque Baixo
              </strong>
            </div>
            <button
              onClick={() => onNavigate('stock_mgmt')}
              style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}
            >
              Enviar Remessa
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sellersWithLowStock.map(s => {
              const summary = storageService.getStockSummary(s.id);
              const googleStock = summary.find(item => item.productId === 'google')?.availableStock ?? 0;
              const instaStock = summary.find(item => item.productId === 'instagram')?.availableStock ?? 0;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.2)',
                    padding: '6px 10px',
                    borderRadius: 8
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Google: <strong style={{ color: googleStock <= s.low_stock_threshold ? '#f87171' : '#fff' }}>{googleStock}</strong> | Instagram: <strong style={{ color: instaStock <= s.low_stock_threshold ? '#f87171' : '#fff' }}>{instaStock}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ações Rápidas de Gestão */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={() => onNavigate('stock_mgmt')}
          style={{ padding: 12, fontSize: 13 }}
        >
          <Plus size={16} />
          <span>Nova Remessa</span>
        </button>
        <button
          className="btn-secondary"
          onClick={() => onNavigate('sellers')}
          style={{ padding: 12, fontSize: 13 }}
        >
          <Users size={16} />
          <span>Gerenciar Equipe</span>
        </button>
      </div>

      {/* Performance Individual dos Vendedores */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 12 }}>
          Equipe de Vendas em Campo ({users.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(seller => {
            const perf = storageService.getSellerPerformance(seller.id);
            const summary = storageService.getStockSummary(seller.id);
            const totalStock = summary.reduce((acc, s) => acc + s.availableStock, 0);

            return (
              <div
                key={seller.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13
                      }}
                    >
                      {seller.name.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: '#fff' }}>{seller.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{seller.phone}</div>
                    </div>
                  </div>

                  <span className={`badge ${seller.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                    {seller.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>
                    Progresso da Meta: <strong>{perf.soldCount}/{seller.monthly_target}</strong> ({perf.progressPercent}%)
                  </span>
                  <span>
                    Estoque: <strong>{totalStock} un</strong>
                  </span>
                </div>

                <div className="goal-bar-container" style={{ margin: 0, height: 6 }}>
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${Math.min(100, perf.progressPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
