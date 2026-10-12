import React, { useState } from 'react';
import type { User } from '../types';
import { ComunicarLogo } from './ComunicarLogo';
import {
  Wifi,
  WifiOff,
  Smartphone,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  isOnline: boolean;
  onOpenPwaModal: () => void;
  onShowSplash: () => void;
  onLogout: () => void;
  pendingSyncCount: number;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] || 'U').toUpperCase();
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isOnline,
  onOpenPwaModal,
  onShowSplash,
  onLogout,
  pendingSyncCount
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const firstName = currentUser.name.split(' ')[0];
  const initials = getInitials(currentUser.name);

  return (
    <header className="app-header">
      <div
        className="brand-section"
        onClick={onShowSplash}
        style={{ cursor: 'pointer' }}
        title="Comunicar Marketing — NFC CONNECT"
      >
        <ComunicarLogo size={32} showText={true} />
      </div>

      <div className="header-actions">
        {/* Status de Conexão */}
        <div
          title={isOnline ? 'Online - Conectado' : 'Offline - Operando em cache local'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: '9999px',
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.2)',
            color: isOnline ? '#34d399' : '#fbbf24',
            fontSize: '11px',
            fontWeight: 700
          }}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {pendingSyncCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '8px',
                marginLeft: 2
              }}
            >
              {pendingSyncCount}
            </span>
          )}
        </div>

        {/* Botão de Instalar no Celular */}
        <button
          className="pwa-install-btn"
          onClick={onOpenPwaModal}
          title="Instalar no Celular como Aplicativo"
        >
          <Smartphone size={13} />
          <span>Instalar</span>
        </button>

        {/* Pílula Unificada com Avatar do Usuário e Opção de Sair/Logout */}
        <div className="user-profile-pill-wrapper">
          <div
            className="user-profile-pill"
            onClick={() => setShowProfileMenu(prev => !prev)}
            title="Perfil do Usuário — Clique para ver detalhes ou sair"
          >
            {/* Avatar circular com iniciais e degradê */}
            <div
              className={`user-avatar-circle ${currentUser.role === 'ADMIN' ? 'user-avatar-admin' : 'user-avatar-seller'}`}
            >
              {initials}
            </div>

            {/* Saudação do usuário */}
            <span className="user-pill-name">Olá, {firstName}</span>

            {/* Separador sutil */}
            <div className="user-pill-divider" />

            {/* Opção de sair/logout integrada na própria pílula */}
            <button
              type="button"
              className="user-pill-logout-action"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Sair da Conta (Logout)"
            >
              <LogOut size={11} />
              <span className="user-pill-logout-text">Sair</span>
            </button>
          </div>

          {/* Menu Popover ao clicar na pílula */}
          {showProfileMenu && (
            <>
              <div
                className="user-menu-backdrop"
                onClick={() => setShowProfileMenu(false)}
              />

              <div className="user-dropdown-popover glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
                  <div
                    className={`user-avatar-circle-large ${currentUser.role === 'ADMIN' ? 'user-avatar-admin' : 'user-avatar-seller'}`}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: 11, color: currentUser.role === 'ADMIN' ? '#fbbf24' : '#34d399', fontWeight: 700, marginTop: 1 }}>
                      {currentUser.role === 'ADMIN' ? '👑 Administrador' : '💼 Vendedor de Campo'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                <button
                  type="button"
                  className="btn-dropdown-logout"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};


