import React, { useState, useEffect } from 'react';
import type { User, StockSummary, Sale, CommissionStatement } from '../../types';
import { api } from '../../services/api';
import {
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  PackageCheck,
  CheckCircle,
  XCircle,
  X,
  CreditCard,
  Eye,
  Camera,
  Phone,
  Mail,
  Award,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Trash2,
  Upload,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface SellersPageProps {
  users: User[];
  sales: Sale[];
  stockSummaries: Record<string, StockSummary[]>;
  onRefreshData: () => void;
}

export const SellersPage: React.FC<SellersPageProps> = ({
  users,
  sales,
  stockSummaries,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Ficha 360° do Vendedor & Histórico de Pagamentos
  const [selectedSellerDetails, setSelectedSellerDetails] = useState<User | null>(null);
  const [commissionStatements, setCommissionStatements] = useState<CommissionStatement[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);
  const [togglingMonth, setTogglingMonth] = useState<string | null>(null);

  // Modais de Zoom
  const [previewPixPhoto, setPreviewPixPhoto] = useState<{ photo: string; title: string; key?: string } | null>(null);
  const [previewInstallationPhoto, setPreviewInstallationPhoto] = useState<{ photo: string; title: string; establishment: string } | null>(null);

  // Feedback de Cópia
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    monthly_target: number;
    low_stock_threshold: number;
    pix_key: string;
    pix_type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
    pix_proof_photo: string | null;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    name: '',
    email: '',
    phone: '',
    monthly_target: 20,
    low_stock_threshold: 5,
    pix_key: '',
    pix_type: 'CPF',
    pix_proof_photo: null,
    status: 'ACTIVE'
  });

  const sellers = users.filter(u => u.role === 'SELLER');

  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carrega extrato de comissões da API
  const loadCommissions = async () => {
    setIsLoadingCommissions(true);
    try {
      const res = await api.getCommissions();
      setCommissionStatements(res.statements || []);
    } catch (err) {
      console.warn('Erro ao carregar extratos de comissão:', err);
    } finally {
      setIsLoadingCommissions(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  // Mantém os dados do vendedor selecionado atualizados quando os usuários mudam
  useEffect(() => {
    if (selectedSellerDetails) {
      const updated = users.find(u => u.id === selectedSellerDetails.id);
      if (updated) {
        setSelectedSellerDetails(updated);
      }
    }
  }, [users]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      monthly_target: 20,
      low_stock_threshold: 5,
      pix_key: '',
      pix_type: 'CPF',
      pix_proof_photo: null,
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      monthly_target: user.monthly_target || 20,
      low_stock_threshold: user.low_stock_threshold || 5,
      pix_key: user.pix_key || '',
      pix_type: user.pix_type || 'CPF',
      pix_proof_photo: user.pix_proof_photo || null,
      status: (user.status as any) || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  // Upload e compressão de foto do Pix (máx 800px, JPEG 0.72)
  const handlePixPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setFormData(prev => ({ ...prev, pix_proof_photo: compressed }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        setFeedback({ message: 'Vendedor atualizado com sucesso!', type: 'success' });
      } else {
        await api.createUser(formData);
        setFeedback({ message: 'Vendedor cadastrado! Senha padrão: vendedor123', type: 'success' });
      }
      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erro ao salvar vendedor', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSessions = async (userId: string, name: string) => {
    if (!window.confirm(`Deseja desconectar e invalidar todas as sessões de ${name}?`)) {
      return;
    }
    try {
      await api.resetUserSessions(userId);
      alert(`Sessões de ${name} encerradas com sucesso.`);
    } catch (err: any) {
      alert(`Erro ao encerrar sessões: ${err.message}`);
    }
  };

  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(pixKey);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Alterna status de pagamento da comissão do mês
  const handleToggleCommission = async (sellerId: string, month: string, currentPaid: boolean) => {
    setTogglingMonth(month);
    try {
      await api.toggleCommission(sellerId, month, !currentPaid);
      await loadCommissions();
      onRefreshData();
    } catch (err: any) {
      alert(`Erro ao atualizar pagamento: ${err.message}`);
    } finally {
      setTogglingMonth(null);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO: FICHA 360° DO VENDEDOR (DETALHES)
  // ==========================================
  if (selectedSellerDetails) {
    const seller = selectedSellerDetails;
    const sellerSales = sales.filter(s => s.seller_id === seller.id);
    const activeSales = sellerSales.filter(s => s.status === 'ACTIVE');
    const platesSold = activeSales.reduce((acc, s) => acc + s.quantity, 0);
    const totalBilled = platesSold * 90.00;
    const totalCommissionGenerated = platesSold * 20.00;

    const summary = stockSummaries[seller.id] || [];
    const googleStock = summary.find(s => s.productId === 'google')?.availableStock || 0;
    const instaStock = summary.find(s => s.productId === 'instagram')?.availableStock || 0;
    const totalInHands = googleStock + instaStock;
    const hasLowStock = summary.some(s => s.isLowStock);

    // Agrupa vendas por mês para gerar o histórico de comissões
    const monthsSet = new Set<string>();
    activeSales.forEach(s => {
      monthsSet.add(s.sale_date.slice(0, 7));
    });
    // Garante que o mês atual esteja na lista
    monthsSet.add(new Date().toISOString().slice(0, 7));

    const sortedMonths = Array.from(monthsSet).sort().reverse();

    const monthlyStatements = sortedMonths.map(month => {
      const mSales = activeSales.filter(s => s.sale_date.startsWith(month));
      const mPlates = mSales.reduce((acc, s) => acc + s.quantity, 0);
      const mDue = mPlates * 20.00;

      const apiStmt = commissionStatements.find(
        cs => cs.seller_id === seller.id && cs.reference_month === month
      );

      const isPaid = apiStmt ? apiStmt.status === 'PAID' : false;

      return {
        month,
        platesCount: mPlates,
        amountDue: mDue,
        isPaid,
        paidAt: apiStmt?.paid_at,
        paidBy: apiStmt?.paid_by,
        receipt: apiStmt?.payment_receipt
      };
    });

    const totalPaid = monthlyStatements
      .filter(m => m.isPaid)
      .reduce((acc, m) => acc + m.amountDue, 0);
    const totalPending = Math.max(0, totalCommissionGenerated - totalPaid);

    const cleanPhone = (seller.phone || '').replace(/\D/g, '');

    return (
      <div className="page-content animate-fade-in">
        {/* Topo com Navegação de Volta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => setSelectedSellerDetails(null)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}
          >
            <ArrowLeft size={16} />
            <span>Voltar para Lista de Vendedores</span>
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleOpenEdit(seller)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Edit2 size={15} />
              <span>Editar Cadastro & Pix</span>
            </button>
            <button
              onClick={() => handleResetSessions(seller.id, seller.name)}
              className="btn btn-secondary"
              style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Desconectar Sessão do Celular"
            >
              <KeyRound size={15} />
              <span>Desconectar Celular</span>
            </button>
          </div>
        </div>

        {/* Header do Vendedor */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--gold-gradient)',
                color: '#000',
                fontSize: 24,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {seller.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {seller.name}
                </h1>
                <span className={`badge ${seller.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  {seller.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  <span>{seller.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} color="var(--text-dim)" />
                  {seller.email}
                </span>

                {seller.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={14} color="var(--text-dim)" />
                    {seller.phone}
                  </span>
                )}

                {cleanPhone && (
                  <a
                    href={`https://wa.me/55${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      color: '#34d399',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '3px 8px',
                      borderRadius: 6
                    }}
                  >
                    <span>Abrir WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Meta de Vendas
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                {seller.monthly_target || 20} placas/mês
              </div>
            </div>
            <div style={{ height: 32, width: 1, background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Alerta de Reposição
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                &le; {seller.low_stock_threshold || 5} placas
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Métricas 360° */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Card: Placas e Faturamento */}
          <div className="table-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Vendas Confirmadas
              </span>
              <Award size={18} color="var(--primary-light)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
              {platesSold} <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>placas</span>
            </div>
            <div style={{ fontSize: 12, color: '#34d399', marginTop: 4 }}>
              Faturamento: R$ {totalBilled.toFixed(2).replace('.', ',')}
            </div>
          </div>

          {/* Card: Placas em Posse (Estoque) */}
          <div className="table-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Estoque em Posse
              </span>
              <PackageCheck size={18} color={hasLowStock ? '#fbbf24' : '#38bdf8'} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: hasLowStock ? '#fbbf24' : '#fff' }}>
              {totalInHands} <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>em mãos</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Google: {googleStock} un. | Instagram: {instaStock} un.
            </div>
          </div>

          {/* Card: Comissões Pagas */}
          <div className="table-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Comissões Pagas
              </span>
              <CheckCircle size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
              R$ {totalPaid.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Transferido via Pix
            </div>
          </div>

          {/* Card: Comissões Pendentes */}
          <div className="table-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Pendente de Pagamento
              </span>
              <Clock size={18} color={totalPending > 0 ? '#fbbf24' : 'var(--text-dim)'} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: totalPending > 0 ? '#fbbf24' : '#fff' }}>
              R$ {totalPending.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Aguardando acerto do gestor
            </div>
          </div>
        </div>

        {/* Seção Dupla: Dados Financeiros / Foto do Pix & Histórico de Pagamentos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
          {/* 1. DADOS FINANCEIROS & FOTO DO PIX (CONFERÊNCIA) */}
          <div className="table-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CreditCard size={18} color="var(--primary-light)" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Conferência de Dados Pix
              </h2>
            </div>

            {seller.pix_key ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'var(--bg-main)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    <span>Tipo de Chave:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{seller.pix_type || 'PIX'}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#38bdf8', wordBreak: 'break-all' }}>
                      {seller.pix_key}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPix(seller.pix_key!)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Copiar Chave Pix"
                    >
                      {copiedKey === seller.pix_key ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedKey === seller.pix_key ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Foto / Comprovante do Pix */}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>
                    Foto / Comprovante Oficial do Pix
                  </span>

                  {seller.pix_proof_photo ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        background: '#090d16',
                        textAlign: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                      }}
                    >
                      <img
                        src={seller.pix_proof_photo}
                        alt="Comprovante Pix"
                        style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewPixPhoto({ photo: seller.pix_proof_photo!, title: seller.name, key: seller.pix_key })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          fontSize: 12,
                          fontWeight: 700,
                          borderTop: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        <Camera size={14} />
                        <span>Visualizar em Tela Cheia</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 10,
                        border: '1px dashed var(--border-subtle)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: 12
                      }}
                    >
                      <Camera size={24} color="var(--text-dim)" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0 }}>Nenhuma foto do cartão ou print Pix anexada.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(seller)}
                        className="btn btn-secondary"
                        style={{ marginTop: 10, padding: '5px 10px', fontSize: 11 }}
                      >
                        Anexar Foto do Pix
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>
                <CreditCard size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>Nenhuma chave Pix cadastrada para este vendedor.</p>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(seller)}
                  className="btn btn-primary"
                  style={{ marginTop: 10, fontSize: 12 }}
                >
                  Cadastrar Chave Pix
                </button>
              </div>
            )}
          </div>

          {/* 2. HISTÓRICO DE PAGAMENTO DE COMISSÕES */}
          <div className="table-card">
            <div className="table-header-box" style={{ padding: '16px 20px' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Histórico Mensal de Pagamentos de Comissão
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Valores apurados com base nas vendas presenciais confirmadas (R$ 20,00 por placa)
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Mês de Referência</th>
                    <th>Placas Vendidas</th>
                    <th>Comissão Total</th>
                    <th>Status do Pagamento</th>
                    <th>Ações de Quitação</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStatements.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                        Nenhum registro de vendas ou pagamentos para este parceiro.
                      </td>
                    </tr>
                  ) : (
                    monthlyStatements.map(stmt => {
                      const isUpdating = togglingMonth === stmt.month;

                      return (
                        <tr key={stmt.month}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-main)' }}>
                              <Calendar size={13} color="var(--primary-light)" />
                              <span>{stmt.month}</span>
                            </div>
                            {stmt.paidAt && (
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                Pago em: {new Date(stmt.paidAt).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                              {stmt.platesCount} un.
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              Faturado: R$ {(stmt.platesCount * 90).toFixed(2).replace('.', ',')}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, fontSize: 15, color: '#34d399' }}>
                              R$ {stmt.amountDue.toFixed(2).replace('.', ',')}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${stmt.isPaid ? 'badge-success' : 'badge-warning'}`}>
                              {stmt.isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                              <span>{stmt.isPaid ? 'Pago' : 'Pendente'}</span>
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleCommission(seller.id, stmt.month, stmt.isPaid)}
                              disabled={isUpdating || stmt.amountDue === 0}
                              className={`btn ${stmt.isPaid ? 'btn-secondary' : 'btn-primary'}`}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                opacity: stmt.amountDue === 0 ? 0.4 : 1
                              }}
                            >
                              {isUpdating
                                ? 'Atualizando...'
                                : stmt.isPaid
                                ? 'Marcar Pendente'
                                : 'Confirmar Pagamento'}
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

        {/* 3. HISTÓRICO DE VENDAS PRESENCIAIS DO VENDEDOR */}
        <div className="table-card">
          <div className="table-header-box" style={{ padding: '16px 20px' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Histórico Consolidado de Vendas Presenciais
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                Listagem de todos os estabelecimentos onde {seller.name} instalou placas
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Data & Hora</th>
                  <th>Estabelecimento Lojista</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor Total</th>
                  <th>Comissão</th>
                  <th>Foto no Balcão</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                      Este vendedor ainda não concluiu nenhuma venda.
                    </td>
                  </tr>
                ) : (
                  sellerSales.map(sale => {
                    const isCancelled = sale.status === 'CANCELLED';

                    return (
                      <tr key={sale.id} style={{ opacity: isCancelled ? 0.55 : 1 }}>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-main)' }}>
                            {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {new Date(sale.sale_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>
                            {sale.establishment_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#38bdf8' }}>
                            NFC & QR Code Gravados
                          </div>
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
                          {sale.installation_photo ? (
                            <button
                              type="button"
                              onClick={() => setPreviewInstallationPhoto({ photo: sale.installation_photo!, title: sale.establishment_name, establishment: sale.establishment_name })}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                color: '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                border: '1px solid rgba(56, 189, 248, 0.3)'
                              }}
                              title="Ver Foto da Instalação"
                            >
                              <Camera size={13} />
                              <span>Ver Foto</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Sem foto</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${!isCancelled ? 'badge-success' : 'badge-danger'}`}>
                            {sale.status === 'ACTIVE' ? 'Ativa' : 'Estornada'}
                          </span>
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
  }

  // ==========================================
  // RENDERIZAÇÃO: LISTAGEM DE VENDEDORES (TABELA PRINCIPAL)
  // ==========================================
  return (
    <div className="page-content animate-fade-in">
      {/* Topo com Ações e Busca */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ position: 'relative', minWidth: 300, flex: 1, maxWidth: 420 }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: 13 }} />
          <input
            type="text"
            placeholder="Buscar vendedor por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 40, width: '100%' }}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Cadastrar Novo Vendedor</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabela de Vendedores */}
      <div className="table-card">
        <div className="table-header-box">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Equipe de Parceiros Comerciais
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {filteredSellers.length} vendedor(es) cadastrado(s) no sistema
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome & Contato</th>
                <th>Status</th>
                <th>Chave & Foto Pix</th>
                <th>Placas em Posse</th>
                <th>Vendas Concluídas</th>
                <th>Meta Mensal</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    Nenhum vendedor encontrado.
                  </td>
                </tr>
              ) : (
                filteredSellers.map(seller => {
                  const sellerSales = sales.filter(s => s.seller_id === seller.id && s.status === 'ACTIVE');
                  const platesSold = sellerSales.reduce((acc, s) => acc + s.quantity, 0);

                  const summary = stockSummaries[seller.id] || [];
                  const googleStock = summary.find(s => s.productId === 'google')?.availableStock || 0;
                  const instaStock = summary.find(s => s.productId === 'instagram')?.availableStock || 0;
                  const totalInHands = googleStock + instaStock;
                  const hasLowStock = summary.some(s => s.isLowStock);

                  return (
                    <tr key={seller.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>
                          {seller.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                          {seller.email} • {seller.phone || 'Sem WhatsApp'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${seller.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {seller.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{seller.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>
                      <td>
                        {seller.pix_key ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <CreditCard size={13} color="var(--primary-light)" />
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                                {seller.pix_key}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                ({seller.pix_type || 'PIX'})
                              </span>
                            </div>

                            {seller.pix_proof_photo && (
                              <button
                                type="button"
                                onClick={() => setPreviewPixPhoto({ photo: seller.pix_proof_photo!, title: seller.name, key: seller.pix_key })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  color: '#fbbf24',
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  width: 'fit-content',
                                  cursor: 'pointer'
                                }}
                              >
                                <Camera size={11} />
                                <span>Ver Foto Pix</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pendente</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: hasLowStock ? '#fbbf24' : 'var(--text-main)' }}>
                            {totalInHands} un.
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            (G: {googleStock} / I: {instaStock})
                          </span>
                          {hasLowStock && (
                            <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: 10 }}>
                              Baixo
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {platesSold} placas
                        </span>
                        <div style={{ fontSize: 11, color: '#34d399' }}>
                          R$ {(platesSold * 90).toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-main)' }}>
                          {seller.monthly_target || 20} placas/mês
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Alerta &le; {seller.low_stock_threshold || 5} un.
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSellerDetails(seller)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Ver Ficha 360° e Histórico de Pagamentos"
                          >
                            <Eye size={14} />
                            <span>Ficha</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(seller)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px' }}
                            title="Editar Cadastro"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetSessions(seller.id, seller.name)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', color: '#f87171' }}
                            title="Desconectar Sessão do Celular"
                          >
                            <KeyRound size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE VENDEDOR COM UPLOAD DE FOTO DO PIX */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PackageCheck size={20} color="var(--primary-light)" />
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                  {editingUser ? 'Editar Parceiro Comercial' : 'Cadastrar Novo Vendedor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="carlos@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="(27) 99999-9999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Chave Pix</label>
                  <select
                    value={formData.pix_type}
                    onChange={e => setFormData({ ...formData, pix_type: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chave Pix Oficial para Pagamento</label>
                  <input
                    type="text"
                    value={formData.pix_key}
                    onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                    className="form-input"
                    placeholder="Chave Pix para recebimento de comissões"
                  />
                </div>
              </div>

              {/* UPLOAD DE FOTO DO PIX (NOVA FUNCIONALIDADE) */}
              <div className="form-group">
                <label className="form-label">
                  Foto / Comprovante do Pix (Para Conferência Financeira)
                </label>
                {formData.pix_proof_photo ? (
                  <div
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      padding: 10,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={formData.pix_proof_photo}
                      alt="Foto Pix"
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                        Comprovante do Pix Anexado
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        Imagem salva para validação no acerto
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pix_proof_photo: null })}
                      style={{
                        padding: 8,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                      title="Remover Foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-main)',
                      border: '1px dashed var(--border-subtle)',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: 12
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePixPhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <Camera size={16} color="var(--primary-light)" />
                    <span>Clique para enviar foto/comprovante do Pix</span>
                  </label>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editingUser ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Meta Mensal (Placas)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.monthly_target}
                    onChange={e => setFormData({ ...formData, monthly_target: parseInt(e.target.value) || 20 })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta Estoque Baixo</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.low_stock_threshold}
                    onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                    className="form-input"
                  />
                </div>

                {editingUser && (
                  <div className="form-group">
                    <label className="form-label">Status da Conta</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="form-select"
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo (Bloqueado)</option>
                    </select>
                  </div>
                )}
              </div>

              {!editingUser && (
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', background: 'var(--bg-main)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                  🔑 A senha inicial do vendedor será gerada automaticamente como <strong>vendedor123</strong>. Ele será solicitado a alterar no primeiro login.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? 'Salvando...' : editingUser ? 'Atualizar Vendedor' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM: FOTO DO PIX */}
      {previewPixPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPixPhoto(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="var(--primary-light)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Comprovante Pix: {previewPixPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPixPhoto(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <img
                src={previewPixPhoto.photo}
                alt="Comprovante Pix"
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
              />
            </div>

            {previewPixPhoto.key && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Chave Pix Cadastrada:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#38bdf8' }}>{previewPixPhoto.key}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPreviewPixPhoto(null)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM: FOTO DA INSTALAÇÃO NO BALCÃO */}
      {previewInstallationPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewInstallationPhoto(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="#38bdf8" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Instalação: {previewInstallationPhoto.establishment}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewInstallationPhoto(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <img
                src={previewInstallationPhoto.photo}
                alt="Instalação no Balcão"
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPreviewInstallationPhoto(null)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
