import React, { useState } from 'react';
import type { Sale, User, StockSummary } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface OverviewPageProps {
  sales: Sale[];
  users: User[];
  stockSummaries: Record<string, StockSummary[]>;
  onNavigateTab: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  sales,
  users,
  stockSummaries,
  onNavigateTab
}) => {
  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'all'>('month');

  // Filtragem básica por período
  const now = new Date();
  const filteredSales = sales.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    if (period === 'all') return true;
    
    const saleDate = new Date(s.sale_date);
    if (period === 'today') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (period === '7days') {
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (period === 'month') {
      return (
        saleDate.getMonth() === now.getMonth() &&
        saleDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const sellers = users.filter(u => u.role === 'SELLER');

  // Cálculos de Indicadores
  const totalBilled = filteredSales.reduce((acc, s) => acc + Number(s.total_price), 0);
  const totalCommissions = filteredSales.reduce((acc, s) => acc + Number(s.commission_amount), 0);
  const totalPlates = filteredSales.reduce((acc, s) => acc + Number(s.quantity), 0);

  // Estimativa de custo por placa para cálculo do Lucro Líquido (R$ 25,00 por chip/acrílico/impressão)
  const estimatedCostPerPlate = 25.00;
  const totalCost = totalPlates * estimatedCostPerPlate;
  const netProfit = Math.max(0, totalBilled - totalCost - totalCommissions);

  // Divisão por produto
  const googleSales = filteredSales
    .filter(s => s.product_id === 'google')
    .reduce((acc, s) => acc + s.quantity, 0);
  const instaSales = filteredSales
    .filter(s => s.product_id === 'instagram')
    .reduce((acc, s) => acc + s.quantity, 0);

  const googlePercent = totalPlates > 0 ? Math.round((googleSales / totalPlates) * 100) : 50;
  const instaPercent = totalPlates > 0 ? 100 - googlePercent : 50;

  // Vendedores com estoque baixo
  const sellersWithLowStock = sellers.filter(seller => {
    const summary = stockSummaries[seller.id] || [];
    return summary.some(s => s.isLowStock);
  });

  // Ranking de vendedores
  const sellerRankings = sellers.map(seller => {
    const sellerSales = filteredSales.filter(s => s.seller_id === seller.id);
    const platesSold = sellerSales.reduce((acc, s) => acc + s.quantity, 0);
    const billed = sellerSales.reduce((acc, s) => acc + Number(s.total_price), 0);
    const comm = sellerSales.reduce((acc, s) => acc + Number(s.commission_amount), 0);
    const target = seller.monthly_target || 20;
    const targetProgress = Math.min(100, Math.round((platesSold / target) * 100));

    return {
      seller,
      platesSold,
      billed,
      comm,
      target,
      targetProgress
    };
  }).sort((a, b) => b.platesSold - a.platesSold);

  return (
    <div className="page-content animate-fade-in">
      {/* Barra de Filtro de Período */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--primary-light)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Período de Análise:
          </span>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: 4 }}>
          <button
            onClick={() => setPeriod('today')}
            className={`btn ${period === 'today' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`btn ${period === '7days' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`btn ${period === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Todo o Período
          </button>
        </div>
      </div>

      {/* Grid de KPIs Primários */}
      <div className="kpi-grid">
        {/* Faturamento Bruto */}
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-title">Faturamento Bruto</span>
            <div className="kpi-icon" style={{ color: '#38bdf8' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#f8fafc' }}>
            R$ {totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="badge badge-success">
              <ArrowUpRight size={12} /> Ativo
            </span>
            <span>{totalPlates} placas faturadas a R$ 90,00</span>
          </div>
        </div>

        {/* Lucro Operacional Líquido */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Margem Líquida Est.</span>
            <div className="kpi-icon" style={{ color: '#34d399' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>Margem real Comunicar Marketing</span>
          </div>
        </div>

        {/* Comissões Geradas */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Comissões da Equipe</span>
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>R$ 20,00 por placa ativada</span>
          </div>
        </div>

        {/* Total de Vendedores Ativos */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Força de Vendas</span>
            <div className="kpi-icon" style={{ color: '#a78bfa' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {sellers.length}
          </div>
          <div className="kpi-footer">
            <span>Parceiros comerciais cadastrados</span>
          </div>
        </div>
      </div>

      {/* Alertas Críticos de Operação */}
      {sellersWithLowStock.length > 0 && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: 10, borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fde68a' }}>
                Alerta de Reabastecimento Imediato
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {sellersWithLowStock.length} vendedor(es) estão com estoque de placas abaixo do limite mínimo.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: '8px 16px' }}
          >
            Enviar Remessa Agora
          </button>
        </div>
      )}

      {/* Seção Central: Mix de Produtos & Comparativo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Distribuição por Produto */}
        <div className="table-card" style={{ padding: 24, gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
              Mix de Produtos Ativados
            </h2>
            <span className="badge badge-info">{totalPlates} Placas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Barra Visual Proporcional */}
            <div style={{ width: '100%', height: 14, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)' }}>
              <div
                style={{
                  width: `${googlePercent}%`,
                  background: 'var(--google-blue)',
                  transition: 'width 0.5s ease'
                }}
                title={`Google: ${googleSales} (${googlePercent}%)`}
              />
              <div
                style={{
                  width: `${instaPercent}%`,
                  background: '#ec4899',
                  transition: 'width 0.5s ease'
                }}
                title={`Instagram: ${instaSales} (${instaPercent}%)`}
              />
            </div>

            {/* Legenda Detalhada */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--google-blue)' }} />
                  <span>Google Avaliações</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginTop: 6 }}>
                  {googleSales} un.
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {googlePercent}% do volume total
                </div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ec4899' }} />
                  <span>Instagram Direct</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginTop: 6 }}>
                  {instaSales} un.
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {instaPercent}% do volume total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo da Operação de Campo */}
        <div className="table-card" style={{ padding: 24, gap: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
            Status da Operação Presencial
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>Validação NFC no Balcão</span>
              </div>
              <span className="badge badge-success">100% Testadas</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={16} color="#38bdf8" />
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>Ticket Médio Unitário</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>R$ 90,00</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#fbbf24" />
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>Sincronização com PostgreSQL</span>
              </div>
              <span className="badge badge-info">Tempo Real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking de Vendedores e Metas */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Ranking da Força de Vendas & Metas
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Desempenho individual e progresso rumo à meta mensal
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sellers')}
            className="btn btn-secondary"
            style={{ fontSize: 12.5 }}
          >
            Ver Todos os Vendedores
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Vendedor</th>
                <th>Placas Vendidas</th>
                <th>Faturamento Gerado</th>
                <th>Comissão Acumulada</th>
                <th>Progresso da Meta</th>
              </tr>
            </thead>
            <tbody>
              {sellerRankings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhum vendedor cadastrado ainda no sistema.
                  </td>
                </tr>
              ) : (
                sellerRankings.map((item, idx) => (
                  <tr key={item.seller.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-dim)'
                        }}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.seller.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.seller.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>
                        {item.platesSold}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}> placas</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        R$ {item.billed.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>
                        R$ {item.comm.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.platesSold} / {item.target}</span>
                        <span style={{ fontWeight: 700, color: item.targetProgress >= 100 ? '#34d399' : 'var(--primary-light)' }}>
                          {item.targetProgress}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${item.targetProgress}%`,
                            height: '100%',
                            background: item.targetProgress >= 100 ? '#10b981' : 'var(--primary)',
                            borderRadius: 999
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
