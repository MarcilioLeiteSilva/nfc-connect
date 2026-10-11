import React from 'react';
import type { UserRole } from '../types';
import {
  Home,
  Package,
  Plus,
  Receipt,
  BookOpen,
  LayoutDashboard,
  Boxes,
  Users,
  Coins
} from 'lucide-react';

interface BottomNavProps {
  role: UserRole;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role, currentTab, onTabChange }) => {
  if (role === 'SELLER') {
    return (
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button
            className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            <div className="nav-icon-wrapper">
              <Home size={19} />
            </div>
            <span>Início</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'stock' ? 'active' : ''}`}
            onClick={() => onTabChange('stock')}
          >
            <div className="nav-icon-wrapper">
              <Package size={19} />
            </div>
            <span>Estoque</span>
          </button>

          {/* Botão de Destaque Central: Venda Rápida */}
          <button
            className="nav-item nav-item-action"
            onClick={() => onTabChange('new_sale')}
            title="Registrar Nova Venda"
          >
            <div className="nav-action-btn">
              <Plus size={28} strokeWidth={2.8} />
            </div>
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>Vender</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            <div className="nav-icon-wrapper">
              <Receipt size={19} />
            </div>
            <span>Extrato</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'materials' ? 'active' : ''}`}
            onClick={() => onTabChange('materials')}
          >
            <div className="nav-icon-wrapper">
              <BookOpen size={19} />
            </div>
            <span>Apoio</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button
          className={`nav-item ${currentTab === 'overview' ? 'active' : ''}`}
          onClick={() => onTabChange('overview')}
        >
          <div className="nav-icon-wrapper">
            <LayoutDashboard size={19} />
          </div>
          <span>Painel</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'stock_mgmt' ? 'active' : ''}`}
          onClick={() => onTabChange('stock_mgmt')}
        >
          <div className="nav-icon-wrapper">
            <Boxes size={19} />
          </div>
          <span>Remessas</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'sellers' ? 'active' : ''}`}
          onClick={() => onTabChange('sellers')}
        >
          <div className="nav-icon-wrapper">
            <Users size={19} />
          </div>
          <span>Vendedores</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'commissions' ? 'active' : ''}`}
          onClick={() => onTabChange('commissions')}
        >
          <div className="nav-icon-wrapper">
            <Coins size={19} />
          </div>
          <span>Comissões</span>
        </button>
      </div>
    </nav>
  );
};
