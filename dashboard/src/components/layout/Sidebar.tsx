import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Building2,
  Nfc,
  BookOpen,
  Shield,
  LogOut,
  Smartphone
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'sales'
  | 'sellers'
  | 'stock'
  | 'commissions'
  | 'crm'
  | 'nfc'
  | 'materials'
  | 'security';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLogout: () => void;
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  userName = 'Administrador'
}) => {
  return (
    <aside className="dashboard-sidebar">
      {/* Topo / Logo */}
      <div className="sidebar-header">
        <div className="brand-badge">NFC</div>
        <div>
          <div className="brand-title">CONNECT</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
            COMUNICAR MARKETING
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Estratégico & Decisão</div>
        <button
          className={`nav-item ${currentTab === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectTab('overview')}
        >
          <LayoutDashboard size={18} />
          <span>Visão Geral & Métricas</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'sales' ? 'active' : ''}`}
          onClick={() => onSelectTab('sales')}
        >
          <ShoppingCart size={18} />
          <span>Vendas & Auditoria</span>
        </button>

        <div className="nav-section-title">Operação & Equipe</div>
        <button
          className={`nav-item ${currentTab === 'sellers' ? 'active' : ''}`}
          onClick={() => onSelectTab('sellers')}
        >
          <Users size={18} />
          <span>Gestão de Vendedores</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'stock' ? 'active' : ''}`}
          onClick={() => onSelectTab('stock')}
        >
          <Package size={18} />
          <span>Estoque & Remessas</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'commissions' ? 'active' : ''}`}
          onClick={() => onSelectTab('commissions')}
        >
          <DollarSign size={18} />
          <span>Comissões & Pagamentos</span>
        </button>

        <div className="nav-section-title">Clientes & Ativos</div>
        <button
          className={`nav-item ${currentTab === 'crm' ? 'active' : ''}`}
          onClick={() => onSelectTab('crm')}
        >
          <Building2 size={18} />
          <span>Lojistas & Clientes</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'nfc' ? 'active' : ''}`}
          onClick={() => onSelectTab('nfc')}
        >
          <Nfc size={18} />
          <span>Placas & Links NFC</span>
        </button>

        <div className="nav-section-title">Capacitação & Apoio</div>
        <button
          className={`nav-item ${currentTab === 'materials' ? 'active' : ''}`}
          onClick={() => onSelectTab('materials')}
        >
          <BookOpen size={18} />
          <span>Materiais de Venda</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'security' ? 'active' : ''}`}
          onClick={() => onSelectTab('security')}
        >
          <Shield size={18} />
          <span>Segurança & Logs</span>
        </button>
      </nav>

      {/* Rodapé do Sidebar */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>
            Super Admin
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            title="Abrir App Vendedor"
            className="btn btn-secondary"
            style={{ padding: '6px 8px' }}
          >
            <Smartphone size={15} />
          </a>
          <button
            onClick={onLogout}
            title="Sair"
            className="btn btn-danger"
            style={{ padding: '6px 8px' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
