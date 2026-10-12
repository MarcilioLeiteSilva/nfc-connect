import React from 'react';
import type { User } from '../../types';
import { storageService } from '../../services/storageService';
import {
  TrendingUp,
  Award,
  DollarSign,
  PlusCircle,
  Package,
  ArrowRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface SellerHomeProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const SellerHome: React.FC<SellerHomeProps> = ({ currentUser, onNavigate }) => {
  const performance = storageService.getSellerPerformance(currentUser.id);
  const stockSummary = storageService.getStockSummary(currentUser.id);

  const hasLowStock = stockSummary.some(s => s.isLowStock);
  const totalStockAvailable = stockSummary.reduce((acc, s) => acc + s.availableStock, 0);

  return (
    <div className="main-content animate-fade-in">
      {/* Eyebrow Oficial Comunicar Marketing */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#fbbf24',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}
            >
              ESTRATÉGIAS QUE GERAM RESULTADOS
            </span>
          </div>
          <h1 style={{ fontSize: 22 }}>
            Olá, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            Marketing que impulsiona negócios • {performance.month}
          </p>
        </div>
        <div className="badge badge-gold" style={{ gap: 4 }}>
          <Sparkles size={12} />
          <span>Meta: {performance.target} un</span>
        </div>
      </div>

      {/* Card da Meta do Mês com Barra de Progresso Dourada */}
      <div className="metric-card metric-card-highlight">
        <div className="metric-card-header">
          <span className="metric-card-title">PROGRESSO DA META MENSAL</span>
          <Award size={18} color="#fbbf24" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span className="metric-card-value">{performance.soldCount}</span>
          <span style={{ fontSize: 16, color: 'var(--text-dim)', fontWeight: 600 }}>
            / {performance.target} placas vendidas
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 16,
              fontWeight: 800,
              color: performance.progressPercent >= 100 ? '#34d399' : '#fbbf24'
            }}
          >
            {performance.progressPercent}%
          </span>
        </div>

        <div className="goal-bar-container">
          <div
            className="goal-bar-fill"
            style={{
              width: `${Math.min(100, performance.progressPercent)}%`,
              background:
                performance.progressPercent >= 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : undefined
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
          <span>
            {performance.soldCount >= performance.target
              ? '🎉 Parabéns! Meta mensal batida!'
              : `Faltam ${performance.target - performance.soldCount} placas para bater a meta`}
          </span>
        </div>
      </div>

      {/* Grid de Ganhos e Faturamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">SUA COMISSÃO</span>
            <DollarSign size={16} color="#10b981" />
          </div>
          <span className="metric-card-value" style={{ color: '#34d399', fontSize: 24 }}>
            R$ {performance.totalCommission.toFixed(2).replace('.', ',')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            R$ 20,00 por placa vendida
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">FATURAMENTO</span>
            <TrendingUp size={16} color="#fbbf24" />
          </div>
          <span className="metric-card-value" style={{ fontSize: 24 }}>
            R$ {performance.totalBilled.toFixed(2).replace('.', ',')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            R$ 90,00 por ativação
          </span>
        </div>
      </div>

      {/* Alerta de Estoque Baixo se houver */}
      {hasLowStock && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, flex: 1 }}>
            <strong style={{ color: '#fbbf24', display: 'block' }}>Atenção: Estoque Baixo!</strong>
            Você possui produto(s) próximo do limite mínimo. Fale com seu gestor para remessa.
          </div>
        </div>
      )}

      {/* Resumo do Saldo Disponível de Placas */}
      <div className="glass-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="#fbbf24" />
            <h3 style={{ fontSize: 15, color: '#fff' }}>Seu Estoque em Mãos</h3>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Ver Detalhes <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stockSummary.map(item => (
            <div
              key={item.productId}
              style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: 12,
                padding: 12,
                border: item.isLowStock ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {item.productId === 'google' ? 'Google 5★' : 'Instagram'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                {item.availableStock}{' '}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dim)' }}>un</span>
              </div>
              <span
                className={`badge ${item.isLowStock ? 'badge-warning' : 'badge-success'}`}
                style={{ fontSize: 10, padding: '2px 6px' }}
              >
                {item.isLowStock ? 'Estoque Baixo' : 'Disponível'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Chamada para Vender */}
      <button
        className="btn-primary"
        onClick={() => onNavigate('new_sale')}
        disabled={totalStockAvailable <= 0}
        style={{
          opacity: totalStockAvailable <= 0 ? 0.5 : 1,
          padding: 16,
          fontSize: 16
        }}
      >
        <PlusCircle size={20} />
        <span>Registrar Nova Venda no Balcão</span>
      </button>
    </div>
  );
};
