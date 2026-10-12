import React, { useState } from 'react';
import type { User } from '../types';
import { storageService } from '../services/storageService';
import { ComunicarLogo } from './ComunicarLogo';
import {
  Wifi,
  WifiOff,
  UserCheck,
  Smartphone,
  ChevronDown,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  isOnline: boolean;
  onOpenPwaModal: () => void;
  onShowSplash: () => void;
  pendingSyncCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isOnline,
  onOpenPwaModal,
  onShowSplash,
  pendingSyncCount
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const users = storageService.getUsers();

  const handleSelectUser = (userId: string) => {
    storageService.setCurrentUserId(userId);
    setShowUserMenu(false);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração originais?')) {
      storageService.resetToDefaults();
      setShowUserMenu(false);
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section" onClick={onShowSplash} style={{ cursor: 'pointer' }} title="Clique para ver a tela Splash da marca">
        <ComunicarLogo size={34} showText={true} />
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

        {/* Seletor de Perfil (Vendedor vs Admin) */}
        <button
          className="role-switcher-btn"
          onClick={() => setShowUserMenu(!showUserMenu)}
          title="Alternar Perfil para Teste"
        >
          {currentUser.role === 'ADMIN' ? (
            <ShieldCheck size={14} color="#fbbf24" />
          ) : (
            <UserCheck size={14} color="#34d399" />
          )}
          <span>{currentUser.name.split(' ')[0]}</span>
          <ChevronDown size={13} />
        </button>
      </div>

      {/* Menu suspenso de usuários */}
      {showUserMenu && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 16,
            width: 260,
            zIndex: 100,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', padding: '4px 8px', letterSpacing: '0.05em' }}>
            ALTERNAR USUÁRIO (TESTE)
          </div>

          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: u.id === currentUser.id ? 'var(--bg-surface-hover)' : 'transparent',
                textAlign: 'left',
                border: u.id === currentUser.id ? '1px solid #fbbf24' : 'none'
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {u.role === 'ADMIN' ? '👑 Administrador' : '💼 Vendedor de Campo'}
                </div>
              </div>
              {u.id === currentUser.id && (
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fbbf24' }} />
              )}
            </button>
          ))}

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button
            onClick={onShowSplash}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 12,
              color: '#fbbf24'
            }}
          >
            <span>✨ Ver Tela Splash da Marca</span>
          </button>

          <button
            onClick={handleResetData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)'
            }}
          >
            <RotateCcw size={13} />
            <span>Restaurar Dados Padrão</span>
          </button>
        </div>
      )}
    </header>
  );
};
