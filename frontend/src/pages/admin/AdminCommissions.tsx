import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import type { Sale } from '../../types';
import { InstagramIcon } from '../../components/InstagramIcon';
import {
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  X,
  Star
} from 'lucide-react';

export const AdminCommissions: React.FC = () => {
  const sellers = storageService.getUsers().filter(u => u.role === 'SELLER');
  const allSales = storageService.getSales();

  // Modal de Estorno
  const [selectedSaleToReverse, setSelectedSaleToReverse] = useState<Sale | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggleCommissionPaid = (sellerId: string, currentPaid: boolean) => {
    storageService.setCommissionPaid(sellerId, '2026-10', !currentPaid);
    setNotice({
      type: 'success',
      message: !currentPaid
        ? 'Comissões marcadas como PAGAS para o vendedor!'
        : 'Status de pagamento revertido para PENDENTE.'
    });
  };

  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleToReverse) return;

    const res = storageService.reverseSale(selectedSaleToReverse.id, reverseReason);
    if (res.success) {
      setNotice({ type: 'success', message: res.message });
      setSelectedSaleToReverse(null);
      setReverseReason('');
    } else {
      setNotice({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="main-content animate-fade-in">
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
          Financeiro & Governança
        </span>
        <h1 style={{ fontSize: 22, marginTop: 2 }}>Comissões e Estornos</h1>
      </div>

      {notice && (
        <div
          style={{
            background: notice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${notice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: notice.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13
          }}
        >
          {notice.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Apuração Mensal por Vendedor */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 12 }}>
          Fechamento Mensal (Outubro / 2026)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sellers.map(seller => {
            const isPaid = storageService.isCommissionPaid(seller.id, '2026-10');
            const perf = storageService.getSellerPerformance(seller.id);

            return (
              <div
                key={seller.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#fff' }}>{seller.name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {perf.soldCount} placas validadas
                    </div>
                  </div>

                  <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                    {isPaid ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>TOTAL A PAGAR</span>
                    <strong style={{ fontSize: 18, color: '#34d399' }}>
                      R$ {perf.totalCommission.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>

                  <button
                    className={isPaid ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleToggleCommissionPaid(seller.id, isPaid)}
                    style={{
                      width: 'auto',
                      padding: '8px 14px',
                      fontSize: 12
                    }}
                  >
                    {isPaid ? 'Reverter para Pendente' : 'Marcar como Paga'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Todas as Vendas & Ação de Estorno */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 12 }}>
          Todas as Vendas ({allSales.length}) & Ações de Estorno
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allSales.map(sale => {
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
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid var(--border-subtle)',
                  opacity: sale.status === 'CANCELLED' ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#fff' }}>{sale.establishment_name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      Vendedor: {sale.seller_name} • {dateStr}
                    </div>
                  </div>

                  <span className={`badge ${sale.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {sale.status === 'ACTIVE' ? 'Ativa' : 'Estornada'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isGoogle ? <Star size={13} color="#60a5fa" /> : <InstagramIcon size={13} color="#f472b6" />}
                    <span>{sale.quantity}x {isGoogle ? 'Google' : 'Instagram'}</span>
                  </div>

                  <div>
                    Valor: R$ {sale.total_price.toFixed(2).replace('.', ',')} | Comissão: R$ {sale.commission_amount.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                {sale.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setSelectedSaleToReverse(sale)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        width: 'auto'
                      }}
                    >
                      <RotateCcw size={12} /> Estornar Venda
                    </button>
                  </div>
                )}

                {sale.status === 'CANCELLED' && sale.cancel_reason && (
                  <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 6 }}>
                    <strong>Justificativa do Estorno:</strong> {sale.cancel_reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE ESTORNO DE VENDA */}
      {selectedSaleToReverse && (
        <div className="modal-overlay" onClick={() => setSelectedSaleToReverse(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, color: '#f87171' }}>Estornar Venda</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSaleToReverse(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-main)', marginBottom: 14 }}>
              Ao estornar a venda de <strong>{selectedSaleToReverse.establishment_name}</strong>, a placa ({selectedSaleToReverse.quantity} un) voltará para o estoque do vendedor e a comissão de R$ {selectedSaleToReverse.commission_amount.toFixed(2).replace('.', ',')} será cancelada.
            </p>

            <form onSubmit={handleConfirmReversal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  JUSTIFICATIVA OBRIGATÓRIA DO ESTORNO
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Cliente desistiu antes do pagamento, erro de digitação do vendedor..."
                  value={reverseReason}
                  onChange={e => setReverseReason(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedSaleToReverse(null)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#ef4444' }}
                >
                  Confirmar Estorno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
