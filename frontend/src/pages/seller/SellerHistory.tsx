import React, { useState } from 'react';
import type { User, ProductId } from '../../types';
import { storageService } from '../../services/storageService';
import { InstagramIcon } from '../../components/InstagramIcon';
import {
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Star
} from 'lucide-react';

interface SellerHistoryProps {
  currentUser: User;
}

export const SellerHistory: React.FC<SellerHistoryProps> = ({ currentUser }) => {
  const [filterProduct, setFilterProduct] = useState<'all' | ProductId>('all');
  const sales = storageService.getSales(currentUser.id);
  const isPaidThisMonth = storageService.isCommissionPaid(currentUser.id, '2026-10');

  const filteredSales = sales.filter(s => {
    if (filterProduct === 'all') return true;
    return s.product_id === filterProduct;
  });

  const totalCommissionsEarned = sales
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + s.commission_amount, 0);

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Extrato Financeiro
          </span>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Minhas Vendas</h1>
        </div>
        <span
          className={`badge ${isPaidThisMonth ? 'badge-success' : 'badge-warning'}`}
          style={{ gap: 4 }}
        >
          {isPaidThisMonth ? 'Comissões Pagas' : 'Comissão Pendente'}
        </span>
      </div>

      {/* Card de Resumo de Comissões */}
      <div className="metric-card metric-card-highlight">
        <div className="metric-card-header">
          <span className="metric-card-title">TOTAL ACUMULADO EM OUTUBRO</span>
          <Receipt size={18} color="#38bdf8" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
          <span className="metric-card-value" style={{ color: '#34d399' }}>
            R$ {totalCommissionsEarned.toFixed(2).replace('.', ',')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>em comissões</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Apuração referente às {sales.filter(s => s.status === 'ACTIVE').length} vendas ativas deste mês.
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn-secondary"
          onClick={() => setFilterProduct('all')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            background: filterProduct === 'all' ? 'var(--primary-glow)' : 'var(--bg-surface-elevated)',
            borderColor: filterProduct === 'all' ? 'var(--primary-light)' : 'var(--border-subtle)',
            color: filterProduct === 'all' ? '#fff' : 'var(--text-muted)'
          }}
        >
          Todas ({sales.length})
        </button>
        <button
          className="btn-secondary"
          onClick={() => setFilterProduct('google')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            background: filterProduct === 'google' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface-elevated)',
            borderColor: filterProduct === 'google' ? '#3b82f6' : 'var(--border-subtle)',
            color: filterProduct === 'google' ? '#fff' : 'var(--text-muted)'
          }}
        >
          Google
        </button>
        <button
          className="btn-secondary"
          onClick={() => setFilterProduct('instagram')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            background: filterProduct === 'instagram' ? 'rgba(236, 72, 153, 0.2)' : 'var(--bg-surface-elevated)',
            borderColor: filterProduct === 'instagram' ? '#ec4899' : 'var(--border-subtle)',
            color: filterProduct === 'instagram' ? '#fff' : 'var(--text-muted)'
          }}
        >
          Instagram
        </button>
      </div>

      {/* Lista de Vendas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredSales.length === 0 ? (
          <div className="glass-panel" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14 }}>Nenhuma venda encontrada para o filtro selecionado.</p>
          </div>
        ) : (
          filteredSales.map(sale => {
            const isGoogle = sale.product_id === 'google';
            const dateStr = new Date(sale.sale_date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={sale.id}
                className="glass-panel"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderLeft: isGoogle ? '4px solid #3b82f6' : '4px solid #ec4899',
                  opacity: sale.status === 'CANCELLED' ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} color="var(--primary-light)" />
                    <strong style={{ fontSize: 15, color: '#fff' }}>{sale.establishment_name}</strong>
                  </div>

                  {sale.status === 'ACTIVE' && (
                    <span className="badge badge-success" style={{ fontSize: 10 }}>
                      <CheckCircle size={10} /> Ativa
                    </span>
                  )}
                  {sale.status === 'PENDING_SYNC' && (
                    <span className="badge badge-warning" style={{ fontSize: 10 }}>
                      <Clock size={10} /> Aguardando Sinal
                    </span>
                  )}
                  {sale.status === 'CANCELLED' && (
                    <span className="badge badge-danger" style={{ fontSize: 10 }}>
                      <XCircle size={10} /> Estornada
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 12px',
                    borderRadius: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isGoogle ? <Star size={14} color="#60a5fa" /> : <InstagramIcon size={14} color="#f472b6" />}
                    <span>
                      {sale.quantity}x {isGoogle ? 'Placa Google' : 'Placa Instagram'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11, marginRight: 6 }}>Comissão:</span>
                    <strong
                      style={{
                        color: sale.status === 'CANCELLED' ? '#ef4444' : '#34d399',
                        fontSize: 14
                      }}
                    >
                      {sale.status === 'CANCELLED' ? 'R$ 0,00' : `+ R$ ${sale.commission_amount.toFixed(2).replace('.', ',')}`}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
                  <span>{dateStr}</span>
                  <span>Valor: R$ {sale.total_price.toFixed(2).replace('.', ',')}</span>
                </div>

                {sale.status === 'CANCELLED' && sale.cancel_reason && (
                  <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 6 }}>
                    <strong>Motivo do Estorno:</strong> {sale.cancel_reason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
