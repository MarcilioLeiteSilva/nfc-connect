import React, { useState } from 'react';
import type { User, StockSummary } from '../../types';
import { api } from '../../services/api';
import {
  Package,
  Send,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';

interface StockPageProps {
  users: User[];
  stockSummaries: Record<string, StockSummary[]>;
  onRefreshData: () => void;
}

export const StockPage: React.FC<StockPageProps> = ({
  users,
  stockSummaries,
  onRefreshData
}) => {
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<'google' | 'instagram'>('google');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sellers = users.filter(u => u.role === 'SELLER');

  // Cálculos consolidados de estoque em campo
  let totalFieldGoogle = 0;
  let totalFieldInsta = 0;
  let totalSellersWithLowStock = 0;

  sellers.forEach(seller => {
    const summary = stockSummaries[seller.id] || [];
    const gStock = summary.find(s => s.productId === 'google')?.availableStock || 0;
    const iStock = summary.find(s => s.productId === 'instagram')?.availableStock || 0;
    totalFieldGoogle += gStock;
    totalFieldInsta += iStock;

    if (summary.some(s => s.isLowStock)) {
      totalSellersWithLowStock += 1;
    }
  });

  const totalFieldStock = totalFieldGoogle + totalFieldInsta;

  const handleSendShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) {
      alert('Por favor, selecione um vendedor para enviar o lote.');
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      await api.sendStockShipment(selectedSeller, selectedProduct, quantity, notes);
      setFeedback({
        message: `Lote de ${quantity} placas enviado com sucesso! O saldo foi creditado no celular do vendedor.`,
        type: 'success'
      });
      setNotes('');
      onRefreshData();
    } catch (err: any) {
      setFeedback({
        message: `Erro ao enviar remessa: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      {/* KPIs de Estoque */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-title">Estoque Total em Campo</span>
            <div className="kpi-icon" style={{ color: '#38bdf8' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {totalFieldStock} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dim)' }}>unidades</span>
          </div>
          <div className="kpi-footer">
            <span>Distribuído entre {sellers.length} vendedores</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Placas Google Ativas</span>
            <div className="kpi-icon" style={{ color: 'var(--google-blue)' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#60a5fa' }}>
            {totalFieldGoogle} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dim)' }}>unidades</span>
          </div>
          <div className="kpi-footer">
            <span>Prontas para balcão</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Placas Instagram Ativas</span>
            <div className="kpi-icon" style={{ color: '#ec4899' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#f472b6' }}>
            {totalFieldInsta} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dim)' }}>unidades</span>
          </div>
          <div className="kpi-footer">
            <span>Prontas para balcão</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Vendedores Críticos</span>
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: totalSellersWithLowStock > 0 ? '#fbbf24' : '#34d399' }}>
            {totalSellersWithLowStock}
          </div>
          <div className="kpi-footer">
            <span>Estoque &le; limite de alerta</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Formulário de Envio de Remessas */}
      <div className="table-card" style={{ padding: 24, gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Send size={18} color="var(--primary-light)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Lançar Envio de Remessa de Placas (Matriz &rarr; Vendedor)
          </h2>
        </div>

        <form onSubmit={handleSendShipment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Vendedor Destinatário *</label>
            <select
              required
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              className="form-select"
            >
              <option value="">Selecione o vendedor...</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Modelo da Placa *</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value as any)}
              className="form-select"
            >
              <option value="google">Placa NFC Google Avaliações</option>
              <option value="instagram">Placa NFC Instagram Direct</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantidade de Placas *</label>
            <input
              type="number"
              required
              min={1}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Protocolo</label>
            <input
              type="text"
              placeholder="Ex: Entrega na sede / Lote 04"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="btn btn-primary"
            style={{ height: 42 }}
          >
            <Send size={16} />
            <span>{isSending ? 'Creditando...' : 'Confirmar Envio'}</span>
          </button>
        </form>
      </div>

      {/* Tabela de Saldos em Campo */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Posição de Estoque por Vendedor
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Acompanhamento de placas em trânsito e necessidade de reposição
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Google Disponível</th>
                <th>Instagram Disponível</th>
                <th>Saldo Total</th>
                <th>Status do Estoque</th>
                <th>Ação Rápida</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhum vendedor cadastrado.
                  </td>
                </tr>
              ) : (
                sellers.map(seller => {
                  const summary = stockSummaries[seller.id] || [];
                  const googleStock = summary.find(s => s.productId === 'google')?.availableStock || 0;
                  const instaStock = summary.find(s => s.productId === 'instagram')?.availableStock || 0;
                  const total = googleStock + instaStock;
                  const isLow = summary.some(s => s.isLowStock);

                  return (
                    <tr key={seller.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {seller.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Alerta &le; {seller.low_stock_threshold || 5} placas
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: 14 }}>
                          {googleStock}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}> un.</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#f472b6', fontSize: 14 }}>
                          {instaStock}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}> un.</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 15 }}>
                          {total}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}> placas</span>
                      </td>
                      <td>
                        <span className={`badge ${!isLow ? 'badge-success' : 'badge-warning'}`}>
                          {!isLow ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          <span>{!isLow ? 'Estoque Saudável' : 'Estoque Baixo'}</span>
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedSeller(seller.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12, gap: 4 }}
                        >
                          <span>Reabastecer</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
