import React from 'react';
import { ShieldCheck, RefreshCw, Bell } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Visão Geral Executiva',
    subtitle: 'Métricas financeiras, volume de placas e desempenho em tempo real'
  },
  sales: {
    title: 'Gestão de Vendas & Auditoria',
    subtitle: 'Listagem de vendas presenciais, fotos de instalação e conferência de links'
  },
  sellers: {
    title: 'Gestão da Força de Vendas',
    subtitle: 'Cadastro de parceiros comerciais, chaves Pix, metas e permissões'
  },
  stock: {
    title: 'Controle de Estoque & Suprimentos',
    subtitle: 'Estoque central matriz, lotes em posse de vendedores e remessas'
  },
  commissions: {
    title: 'Comissões & Central de Pagamentos',
    subtitle: 'Fechamento de pagamentos via Pix, extrato e demonstrativo operacional'
  },
  crm: {
    title: 'Lojistas & Base de Clientes',
    subtitle: 'Estabelecimentos atendidos, contato dos proprietários e oportunidades de upsell'
  },
  nfc: {
    title: 'Tecnologia NFC & Catálogo',
    subtitle: 'Placas ativas no mercado, links de redirecionamento e novos produtos'
  },
  materials: {
    title: 'Materiais de Apoio & Treinamentos',
    subtitle: 'Gerenciador de pitches, roteiros presenciais e manuais para vendedores'
  },
  security: {
    title: 'Segurança, Perfis & Auditoria',
    subtitle: 'Logs de ações executivas, sessões ativas e controle de acessos'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onRefresh,
  isLoading = false
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Painel Administrativo',
    subtitle: 'NFC CONNECT'
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {currentInfo.title}
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Status de Conexão com Banco */}
        <div className="badge badge-success" style={{ gap: 6 }}>
          <ShieldCheck size={14} />
          <span>PostgreSQL Conectado</span>
        </div>

        {/* Botão de Atualizar Dados */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: 13 }}
            title="Atualizar dados do servidor"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        )}

        <button
          className="btn btn-secondary"
          style={{ padding: '8px 10px', position: 'relative' }}
          title="Notificações da Operação"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
};
