import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      if (res.user.role !== 'ADMIN') {
        throw new Error('Acesso restrito: Esta conta não possui privilégios de Administrador.');
      }
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 20%, #0e1e4a 0%, #030712 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: 420,
          background: 'rgba(11, 19, 43, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gold-gradient)',
              color: '#000',
              fontWeight: 800,
              fontSize: 14,
              marginBottom: 12
            }}
          >
            NFC CONNECT
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Painel Executivo
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Acesso administrativo Comunicar Marketing
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: 12.5
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">E-mail Corporativo</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 38, width: '100%' }}
                placeholder="admin@nfcconnect.com.br"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha de Acesso</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 38, width: '100%' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', height: 44, marginTop: 4 }}
          >
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Painel Executivo'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, textAlign: 'center', fontSize: 11.5, color: 'var(--text-dim)' }}>
          <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#10b981' }} />
          <span>Ambiente Restrito & Monitorado por Logs</span>
        </div>
      </div>
    </div>
  );
};
