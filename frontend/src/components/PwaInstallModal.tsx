import React from 'react';
import { X, Share, PlusSquare, MoreVertical, Smartphone, CheckCircle } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, color: '#fff' }}>Instalar no Celular</h3>
              <p style={{ fontSize: 12 }}>Acesso universal direto na tela inicial</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card iPhone (iOS) */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🍎</span>
              <strong style={{ color: '#fff', fontSize: 15 }}>No iPhone (Safari)</strong>
            </div>
            <ol style={{ paddingLeft: 18, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                Abra este link no navegador <strong>Safari</strong> do iPhone.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Toque no botão de <strong>Compartilhar</strong> <Share size={14} color="#38bdf8" /> na barra inferior.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={14} color="#38bdf8" />.
              </li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
          </div>

          {/* Card Android */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <strong style={{ color: '#fff', fontSize: 15 }}>No Android (Chrome)</strong>
            </div>
            <ol style={{ paddingLeft: 18, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Abra este link no navegador <strong>Google Chrome</strong>.</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Toque nos <strong>três pontinhos</strong> <MoreVertical size={14} color="#38bdf8" /> no topo.
              </li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme para criar o ícone nativo no seu aparelho.</li>
            </ol>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: 12,
              borderRadius: 12,
              fontSize: 12,
              color: '#34d399'
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              O app funcionará em tela cheia, sem barra de navegação, com suporte offline completo!
            </span>
          </div>

          <button className="btn-primary" onClick={onClose}>
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
