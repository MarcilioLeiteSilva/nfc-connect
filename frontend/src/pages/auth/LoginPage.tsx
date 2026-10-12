import React, { useState } from 'react';
import { ComunicarLogo } from '../../components/ComunicarLogo';
import { api, setAuthToken } from '../../services/api';
import { storageService } from '../../services/storageService';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Tenta autenticar na API Real (PostgreSQL)
      try {
        const res = await api.login(email, password);
        setAuthToken(res.token);
        storageService.setCurrentUserId(res.user.id);
        onLoginSuccess();
        return;
      } catch (apiErr: any) {
        // Se a API estiver offline ou em simulação, tenta validar no armazenamento local
        const users = storageService.getUsers();
        const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (found) {
          storageService.setCurrentUserId(found.id);
          onLoginSuccess();
          return;
        }

        setError(apiErr.message || 'E-mail ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: 'admin' | 'seller') => {
    if (type === 'admin') {
      setEmail('admin@comunicarmarketing.com.br');
      setPassword('Cascavel@#01');
    } else {
      setEmail('joao.silva@comunicarmarketing.com.br');
      setPassword('vendedor123');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 20px',
        background: 'radial-gradient(circle at 50% 25%, #0f1c3d 0%, #030712 70%)'
      }}
    >
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
        {/* Logo Central */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <ComunicarLogo size={64} showText={false} />
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 14 }}>
            COMUNICAR <span style={{ color: '#fbbf24' }}>MARKETING</span>
          </h1>
          <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
            NFC CONNECT • Acesso Seguro
          </span>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#f87171',
              fontSize: 13,
              marginBottom: 16
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
              E-MAIL PROFISSIONAL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="seu.email@comunicarmarketing.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: 40 }}
              />
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
              SENHA DE ACESSO
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: 40 }}
              />
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            <span>{loading ? 'Validando acesso...' : 'Entrar no Sistema'}</span>
            <ArrowRight size={18} />
          </button>

          {/* Atalhos de Preenchimento Rápido para Demonstração */}
          <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', fontWeight: 600 }}>
              PREENCHIMENTO RÁPIDO PARA TESTE:
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleQuickFill('admin')}
                style={{ fontSize: 11, padding: '8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ShieldCheck size={13} color="#fbbf24" />
                <span>Admin Gestor</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleQuickFill('seller')}
                style={{ fontSize: 11, padding: '8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <UserCheck size={13} color="#34d399" />
                <span>Vendedor João</span>
              </button>
            </div>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 24 }}>
          "Conecte seu negócio ao cliente com um toque." • Comunicar Marketing © 2026
        </p>
      </div>
    </div>
  );
};
