import React, { useState } from 'react';
import type { Sale, User } from '../../types';
import { api } from '../../services/api';
import {
  Search,
  Download,
  AlertCircle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

interface SalesPageProps {
  sales: Sale[];
  users: User[];
  onRefreshData: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  sales,
  users,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [productFilter, setProductFilter] = useState<'ALL' | 'google' | 'instagram'>('ALL');
  const [reversingSaleId, setReversingSaleId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [isSubmittingReverse, setIsSubmittingReverse] = useState(false);

  // Mapeia nomes de vendedores
  const userMap = new Map(users.map(u => [u.id, u.name]));

  const filteredSales = sales.filter(s => {
    const sellerName = userMap.get(s.seller_id) || s.seller_id;
    const matchesSearch =
      s.establishment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sellerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesProduct = productFilter === 'ALL' || s.product_id === productFilter;

    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('Nenhuma venda para exportar no filtro atual.');
      return;
    }

    const headers = ['ID', 'Data', 'Vendedor', 'Estabelecimento', 'Produto', 'Quantidade', 'Valor Total (R$)', 'Comissao (R$)', 'Status'];
    const rows = filteredSales.map(s => [
      s.id,
      new Date(s.sale_date).toLocaleString('pt-BR'),
      `"${userMap.get(s.seller_id) || s.seller_id}"`,
      `"${s.establishment_name}"`,
      s.product_id === 'google' ? 'Google Avaliações' : 'Instagram',
      s.quantity,
      s.total_price.toFixed(2),
      s.commission_amount.toFixed(2),
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendas_nfc_connect_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingSaleId || reverseReason.trim().length < 4) {
      alert('Por favor, informe a justificativa detalhada do estorno.');
      return;
    }

    setIsSubmittingReverse(true);
    try {
      await api.reverseSale(reversingSaleId, reverseReason);
      alert('Venda estornada com sucesso! A placa foi devolvida ao estoque do vendedor.');
      setReversingSaleId(null);
      setReverseReason('');
      onRefreshData();
    } catch (err: any) {
      alert(`Erro ao estornar venda: ${err.message}`);
    } finally {
      setIsSubmittingReverse(false);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Topo com Filtros e Exportação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: 13 }} />
            <input
              type="text"
              placeholder="Buscar por estabelecimento ou vendedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 40, width: '100%' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="form-select"
            style={{ width: 140 }}
          >
            <option value="ALL">Todos Status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="CANCELLED">Estornadas</option>
          </select>

          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value as any)}
            className="form-select"
            style={{ width: 160 }}
          >
            <option value="ALL">Todos os Produtos</option>
            <option value="google">Placa Google</option>
            <option value="instagram">Placa Instagram</option>
          </select>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary">
          <Download size={16} />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Tabela de Vendas */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Histórico Consolidado de Vendas
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Exibindo {filteredSales.length} venda(s) realizada(s) pela equipe
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Estabelecimento Lojista</th>
                <th>Vendedor Responsável</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Faturamento</th>
                <th>Comissão</th>
                <th>Status</th>
                <th>Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const sellerName = userMap.get(sale.seller_id) || sale.seller_id;
                  const isCancelled = sale.status === 'CANCELLED';

                  return (
                    <tr key={sale.id} style={{ opacity: isCancelled ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Calendar size={13} color="var(--text-dim)" />
                          <span style={{ color: 'var(--text-main)' }}>
                            {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {new Date(sale.sale_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>
                          {sale.establishment_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#38bdf8' }}>
                          NFC & QR Code Gravados
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--text-main)' }}>
                          {sellerName}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: sale.product_id === 'google' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                            color: sale.product_id === 'google' ? '#60a5fa' : '#f472b6',
                            border: `1px solid ${sale.product_id === 'google' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)'}`
                          }}
                        >
                          {sale.product_id === 'google' ? 'Google Avaliações' : 'Instagram Direct'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                          {sale.quantity} un.
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          R$ {Number(sale.total_price).toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>
                          R$ {Number(sale.commission_amount).toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${!isCancelled ? 'badge-success' : 'badge-danger'}`}>
                          {!isCancelled ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{!isCancelled ? 'Ativa' : 'Estornada'}</span>
                        </span>
                      </td>
                      <td>
                        {!isCancelled ? (
                          <button
                            onClick={() => {
                              setReversingSaleId(sale.id);
                              setReverseReason('');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: 11, color: '#f87171' }}
                            title="Estornar Venda e Devolver Placa"
                          >
                            <RotateCcw size={13} />
                            <span>Estornar</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }} title={sale.cancel_reason}>
                            {sale.cancel_reason ? `${sale.cancel_reason.slice(0, 20)}...` : 'Estornada'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Estorno de Venda */}
      {reversingSaleId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={22} color="#f87171" />
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f87171' }}>
                Estornar Venda Presencial
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Esta ação cancelará a venda, anulará a comissão de R$ 20,00 e <strong>devolverá automaticamente a placa</strong> ao saldo disponível do vendedor.
            </p>

            <form onSubmit={handleExecuteReverse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Justificativa do Estorno *</label>
                <textarea
                  required
                  rows={3}
                  value={reverseReason}
                  onChange={e => setReverseReason(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Estabelecimento cancelou a compra no mesmo dia / Placa trocada por defeito..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setReversingSaleId(null)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReverse}
                  className="btn btn-danger"
                >
                  {isSubmittingReverse ? 'Processando...' : 'Confirmar Estorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
