import React, { useState } from 'react';
import type { User, Sale } from '../../types';
import { api } from '../../services/api';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  CreditCard,
  Calculator
} from 'lucide-react';

interface CommissionsPageProps {
  users: User[];
  sales: Sale[];
  onRefreshData: () => void;
}

export const CommissionsPage: React.FC<CommissionsPageProps> = ({
  users,
  sales,
  onRefreshData
}) => {
  const currentMonthKey = new Date().toISOString().slice(0, 7); // '2026-10'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Armazena pagamentos locais ou do servidor
  const [paidState, setPaidState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nfc_admin_paid_commissions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const sellers = users.filter(u => u.role === 'SELLER');

  // Vendas do mês selecionado
  const monthSales = sales.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    const sMonth = s.sale_date.slice(0, 7);
    return sMonth === selectedMonth;
  });

  // Cálculo individual por vendedor
  const commissionList = sellers.map(seller => {
    const sSales = monthSales.filter(s => s.seller_id === seller.id);
    const platesCount = sSales.reduce((acc, s) => acc + s.quantity, 0);
    const amountDue = sSales.reduce((acc, s) => acc + Number(s.commission_amount), 0);
    const key = `${seller.id}_${selectedMonth}`;
    const isPaid = !!paidState[key];

    return {
      seller,
      platesCount,
      amountDue,
      isPaid,
      key
    };
  });

  // Totais do período
  const totalCommissionsDue = commissionList.reduce((acc, c) => acc + c.amountDue, 0);
  const totalPaid = commissionList.filter(c => c.isPaid).reduce((acc, c) => acc + c.amountDue, 0);
  const totalPending = totalCommissionsDue - totalPaid;
  const totalPlatesInMonth = monthSales.reduce((acc, s) => acc + s.quantity, 0);
  const totalBilledMonth = totalPlatesInMonth * 90.00;
  const totalPlateCostMonth = totalPlatesInMonth * 25.00; // Custo estimado unitário
  const netMarginMonth = Math.max(0, totalBilledMonth - totalPlateCostMonth - totalCommissionsDue);

  const handleTogglePaid = async (sellerId: string, currentStatus: boolean, key: string) => {
    setIsUpdating(sellerId);
    const newStatus = !currentStatus;

    try {
      await api.toggleCommission(sellerId, selectedMonth, newStatus);
      const updated = { ...paidState, [key]: newStatus };
      setPaidState(updated);
      localStorage.setItem('nfc_admin_paid_commissions', JSON.stringify(updated));
      onRefreshData();
    } catch (err: any) {
      // Fallback local se a tabela de statements não estiver com constraint
      const updated = { ...paidState, [key]: newStatus };
      setPaidState(updated);
      localStorage.setItem('nfc_admin_paid_commissions', JSON.stringify(updated));
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(pixKey);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Seletor do Mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Fechamento de Comissões
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
            Central Financeira de Pagamentos
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className="form-label" style={{ margin: 0 }}>Mês de Referência:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="form-input"
            style={{ width: 170 }}
          />
        </div>
      </div>

      {/* KPIs de Comissões */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-title">Comissões a Pagar</span>
            <div className="kpi-icon" style={{ color: '#fbbf24' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            R$ {totalPending.toFixed(2).replace('.', ',')}
          </div>
          <div className="kpi-footer">
            <span>Aguardando transferência Pix</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Comissões Liquidadas</span>
            <div className="kpi-icon" style={{ color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            R$ {totalPaid.toFixed(2).replace('.', ',')}
          </div>
          <div className="kpi-footer">
            <span>Pagamentos confirmados</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Geral Gerado</span>
            <div className="kpi-icon" style={{ color: '#38bdf8' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value">
            R$ {totalCommissionsDue.toFixed(2).replace('.', ',')}
          </div>
          <div className="kpi-footer">
            <span>{totalPlatesInMonth} placas no mês selecionado</span>
          </div>
        </div>
      </div>

      {/* Demonstrativo de Resultados Simplificado (DRE da Operação) */}
      <div className="table-card" style={{ padding: 22, background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-surface) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Calculator size={18} color="#34d399" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            DRE Operacional — Mês {selectedMonth}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>1. Faturamento Bruto</span>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
              (+) R$ {totalBilledMonth.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>2. Custo das Placas (CMV)</span>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f87171', marginTop: 4 }}>
              (-) R$ {totalPlateCostMonth.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>3. Comissões da Equipe</span>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>
              (-) R$ {totalCommissionsDue.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>4. Margem Líquida da Empresa</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
              (=) R$ {netMarginMonth.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Fechamento por Vendedor */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Folha de Comissões por Vendedor
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Consulte a chave Pix de cada parceiro e confirme a liquidação
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Chave Pix Oficial</th>
                <th>Placas Faturadas</th>
                <th>Valor da Comissão</th>
                <th>Status do Pagamento</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {commissionList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhum vendedor cadastrado.
                  </td>
                </tr>
              ) : (
                commissionList.map(item => (
                  <tr key={item.seller.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.seller.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {item.seller.phone || item.seller.email}
                      </div>
                    </td>
                    <td>
                      {item.seller.pix_key ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CreditCard size={14} color="var(--primary-light)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-main)' }}>
                            {item.seller.pix_key}
                          </span>
                          <button
                            onClick={() => handleCopyPix(item.seller.pix_key!)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', fontSize: 11 }}
                            title="Copiar Chave Pix"
                          >
                            {copiedKey === item.seller.pix_key ? (
                              <Check size={12} color="#10b981" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          Sem chave Pix cadastrada
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                        {item.platesCount} placas
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#34d399' }}>
                        R$ {item.amountDue.toFixed(2).replace('.', ',')}
                      </span>
                      <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                        R$ 20,00 / un.
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.isPaid ? 'badge-success' : 'badge-warning'}`}>
                        {item.isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{item.isPaid ? 'Liquidado (Pago)' : 'Pendente de Pagamento'}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleTogglePaid(item.seller.id, item.isPaid, item.key)}
                        disabled={isUpdating === item.seller.id || item.amountDue === 0}
                        className={`btn ${item.isPaid ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        {item.isPaid ? 'Desfazer Baixa' : 'Confirmar Pagamento'}
                      </button>
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
