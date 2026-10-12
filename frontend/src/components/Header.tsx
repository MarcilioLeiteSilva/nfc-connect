import React from 'react';
import type { User } from '../types';
import { ComunicarLogo } from './ComunicarLogo';
import {
  Wifi,
  WifiOff,
  UserCheck,
  ShieldCheck,
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

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isOnline,
  onOpenPwaModal,
  onShowSplash,
  onLogout,
  pendingSyncCount
}) => {
  const firstName = currentUser.name.split(' ')[0];

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

        {/* Saudação Exclusiva do Vendedor/Usuário Logado (Privacidade Total) */}
        <div
          className="user-greeting-badge"
          title={`Conectado como ${currentUser.name}`}
        >
          {currentUser.role === 'ADMIN' ? (
            <ShieldCheck size={14} color="#fbbf24" />
          ) : (
            <UserCheck size={14} color="#34d399" />
          )}
          <span>Olá, {firstName}</span>
        </div>

        {/* Botão Direto de Logout */}
        <button
          className="header-logout-btn"
          onClick={onLogout}
          title="Sair da Conta"
        >
          <LogOut size={13} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};

