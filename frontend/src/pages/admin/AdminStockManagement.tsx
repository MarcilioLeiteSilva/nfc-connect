import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import type { ProductId } from '../../types';
import {
  Plus,
  Wrench,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const AdminStockManagement: React.FC = () => {
  useEffect(() => {
    storageService.fetchAdminUsersFromApi();
  }, []);

  const sellers = storageService.getUsers().filter(u => u.role === 'SELLER');

  const movements = storageService.getMovements();

  // Estados do Modal de Remessa
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(sellers[0]?.id || '');
  const [googleQty, setGoogleQty] = useState(10);
  const [instagramQty, setInstagramQty] = useState(10);
  const [notes, setNotes] = useState('');

  // Estados do Modal de Correção
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrSellerId, setCorrSellerId] = useState(sellers[0]?.id || '');
  const [corrProductId, setCorrProductId] = useState<ProductId>('google');
  const [corrQty, setCorrQty] = useState(1);
  const [corrReason, setCorrReason] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleQty <= 0 && instagramQty <= 0) {
      setFeedbackMessage({ type: 'error', text: 'Informe ao menos 1 unidade em um dos modelos.' });
      return;
    }

    storageService.addStockShipment({
      sellerId: selectedSellerId,
      googleQty,
      instagramQty,
      notes
    });

    setFeedbackMessage({ type: 'success', text: 'Remessa enviada com sucesso ao vendedor!' });
    setShowShipmentModal(false);
    setNotes('');
  };

  const handleCorrectStock = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storageService.correctStock({
      sellerId: corrSellerId,
      productId: corrProductId,
      adjustmentQty: corrQty,
      reason: corrReason
    });

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setShowCorrectionModal(false);
      setCorrReason('');
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Administração
          </span>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Controle de Estoque</h1>
        </div>
      </div>

      {feedbackMessage && (
        <div
          style={{
            background: feedbackMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedbackMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: feedbackMessage.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13
          }}
        >
          {feedbackMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Botões de Ação */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn-primary" onClick={() => setShowShipmentModal(true)}>
          <Plus size={18} />
          <span>Enviar Remessa</span>
        </button>

        <button className="btn-secondary" onClick={() => setShowCorrectionModal(true)}>
          <Wrench size={18} />
          <span>Lançar Correção</span>
        </button>
      </div>

      {/* Visão de Saldos da Equipe */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 12 }}>
          Estoque Atual por Vendedor
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sellers.map(s => {
            const summary = storageService.getStockSummary(s.id);
            const google = summary.find(item => item.productId === 'google');
            const insta = summary.find(item => item.productId === 'instagram');

            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: '#fff' }}>{s.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.email}</div>
                </div>

                <div style={{ display: 'flex', gap: 12, textAlign: 'right', fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>GOOGLE</span>
                    <strong style={{ color: google?.isLowStock ? '#f87171' : '#38bdf8', fontSize: 15 }}>
                      {google?.availableStock} un
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>INSTAGRAM</span>
                    <strong style={{ color: insta?.isLowStock ? '#f87171' : '#ec4899', fontSize: 15 }}>
                      {insta?.availableStock} un
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico Auditável */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 12 }}>
          Auditoria de Movimentações (Append-Only)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {movements.slice(0, 10).map(m => {
            const seller = sellers.find(s => s.id === m.seller_id);
            const isPositive = m.quantity > 0;
            const dateStr = new Date(m.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={m.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--bg-surface-elevated)',
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{seller?.name || 'Vendedor'}: </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {m.type === 'IN_SHIPMENT' && 'Remessa enviada'}
                    {m.type === 'OUT_SALE' && 'Venda realizada'}
                    {m.type === 'IN_REVERSAL' && 'Estorno'}
                    {m.type === 'CORRECTION' && 'Correção manual'}
                  </span>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {m.product_id === 'google' ? 'Google' : 'Instagram'} • {dateStr}
                    {m.reason && ` • Motivo: ${m.reason}`}
                  </div>
                </div>

                <strong style={{ color: isPositive ? '#34d399' : '#f87171', fontSize: 14 }}>
                  {isPositive ? `+${m.quantity}` : m.quantity}
                </strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE NOVA REMESSA */}
      {showShipmentModal && (
        <div className="modal-overlay" onClick={() => setShowShipmentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>Nova Remessa de Estoque</h3>
            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  VENDEDOR DESTINATÁRIO
                </label>
                <select
                  value={selectedSellerId}
                  onChange={e => setSelectedSellerId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', display: 'block', marginBottom: 4 }}>
                    QTD GOOGLE
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={googleQty}
                    onChange={e => setGoogleQty(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#f472b6', display: 'block', marginBottom: 4 }}>
                    QTD INSTAGRAM
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={instagramQty}
                    onChange={e => setInstagramQty(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  OBSERVAÇÕES DO ENVIO (OPCIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entregue em mãos / Lote semanal..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowShipmentModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CORREÇÃO AUDITADA */}
      {showCorrectionModal && (
        <div className="modal-overlay" onClick={() => setShowCorrectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>Correção de Estoque Auditada</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Ajustes não apagam o histórico. É obrigatório justificar o motivo.
            </p>

            <form onSubmit={handleCorrectStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  VENDEDOR
                </label>
                <select
                  value={corrSellerId}
                  onChange={e => setCorrSellerId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    MODELO
                  </label>
                  <select
                    value={corrProductId}
                    onChange={e => setCorrProductId(e.target.value as ProductId)}
                    style={{ width: '100%' }}
                  >
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    AJUSTE (QTD)
                  </label>
                  <input
                    type="number"
                    value={corrQty}
                    onChange={e => setCorrQty(Number(e.target.value))}
                    style={{ width: '100%' }}
                    placeholder="+1 ou -1"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  MOTIVO OBRIGATÓRIO (AUDITORIA)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Placa danificada no transporte, recontagem física..."
                  value={corrReason}
                  onChange={e => setCorrReason(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCorrectionModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Aplicar Correção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
