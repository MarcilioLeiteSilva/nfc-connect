import React from 'react';
import type { User } from '../../types';
import { storageService } from '../../services/storageService';
import { InstagramIcon } from '../../components/InstagramIcon';
import {
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Star
} from 'lucide-react';

interface SellerStockProps {
  currentUser: User;
}

export const SellerStock: React.FC<SellerStockProps> = ({ currentUser }) => {
  React.useEffect(() => {
    storageService.syncSellerDataFromApi();
  }, [currentUser.id]);

  const stockSummary = storageService.getStockSummary(currentUser.id);
  const movements = storageService.getMovements(currentUser.id);

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Painel do Vendedor
          </span>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Consulta de Estoque</h1>
        </div>
        <div
          className="badge"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            gap: 4
          }}
        >
          <Lock size={12} />
          <span>Apenas Leitura</span>
        </div>
      </div>

      {/* Banner da Regra de Ouro */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: 14,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--text-muted)'
        }}
      >
        <Lock size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span>
          O estoque físico é gerido exclusivamente pela administração. Novos envios e correções são lançados pelo seu gestor.
        </span>
      </div>

      {/* Cards dos 2 Produtos Oficiais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stockSummary.map(item => {
          const isGoogle = item.productId === 'google';

          return (
            <div
              key={item.productId}
              className={`product-card ${isGoogle ? 'google-theme' : 'instagram-theme'}`}
            >
              <div className="product-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: isGoogle ? 'rgba(59, 130, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isGoogle ? '#60a5fa' : '#f472b6'
                    }}
                  >
                    {isGoogle ? <Star size={20} /> : <InstagramIcon size={20} color="#f472b6" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, color: '#fff' }}>{item.productName}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {isGoogle ? 'Avaliações 5 Estrelas no Google' : 'Seguidores & Direct Instagram'}
                    </p>
                  </div>
                </div>

                <span className={`badge ${item.isLowStock ? 'badge-warning' : 'badge-success'}`}>
                  {item.isLowStock ? 'Estoque Baixo' : 'Em Dia'}
                </span>
              </div>

              {/* Saldo Disponível Grande */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 0' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                    SALDO DISPONÍVEL
                  </span>
                  <div className="stock-tag-big">
                    {item.availableStock}{' '}
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>unidades</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                    PREÇO / COMISSÃO
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                    R$ 90 <span style={{ color: 'var(--text-dim)' }}>|</span> R$ 20
                  </div>
                </div>
              </div>

              {/* Decomposição do Cálculo: Fórmula do Estoque Disponível */}
              <div className="stock-breakdown">
                <div className="stock-breakdown-item">
                  <span className="stock-breakdown-label">Total Enviado (Admin)</span>
                  <span className="stock-breakdown-val" style={{ color: '#60a5fa' }}>
                    +{item.totalSent} un
                  </span>
                </div>
                <div className="stock-breakdown-item">
                  <span className="stock-breakdown-label">Total Vendido</span>
                  <span className="stock-breakdown-val" style={{ color: '#34d399' }}>
                    {item.totalSold} un
                  </span>
                </div>
                <div className="stock-breakdown-item">
                  <span className="stock-breakdown-label">Ajustes / Correções</span>
                  <span className="stock-breakdown-val">
                    {item.corrections >= 0 ? `+${item.corrections}` : item.corrections} un
                  </span>
                </div>
                <div className="stock-breakdown-item">
                  <span className="stock-breakdown-label">Alerta Mínimo</span>
                  <span className="stock-breakdown-val" style={{ color: '#fbbf24' }}>
                    ≤ {currentUser.low_stock_threshold} un
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico Recente de Movimentações */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <History size={18} color="#38bdf8" />
          <h3 style={{ fontSize: 15, color: '#fff' }}>Histórico de Movimentações</h3>
        </div>

        {movements.length === 0 ? (
          <p style={{ fontSize: 13, textAlign: 'center', padding: 12 }}>Nenhuma movimentação registrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {movements.slice(0, 6).map(m => {
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'var(--bg-surface-elevated)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPositive ? '#34d399' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {m.type === 'IN_SHIPMENT' && 'Remessa Recebida'}
                        {m.type === 'OUT_SALE' && 'Saída por Venda'}
                        {m.type === 'IN_REVERSAL' && 'Estorno Devolvido'}
                        {m.type === 'CORRECTION' && 'Correção de Estoque'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {m.product_id === 'google' ? 'Placa Google' : 'Placa Instagram'} • {dateStr}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: isPositive ? '#34d399' : '#f87171'
                    }}
                  >
                    {isPositive ? `+${m.quantity}` : m.quantity} un
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
