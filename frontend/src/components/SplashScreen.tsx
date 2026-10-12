import React, { useEffect, useState } from 'react';
import { ComunicarLogo } from './ComunicarLogo';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2400
}) => {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Inicia o fade out próximo do final
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, durationMs - 400);

    const finishTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  if (!visible) return null;

  const handleSkip = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 35%, #0f1c3d 0%, #050a16 65%, #02050c 100%)',
        padding: 24,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fading ? 'none' : 'auto'
      }}
    >
      {/* Luz ambiente de fundo (Glow Dourado) */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
          position: 'relative',
          zIndex: 2,
          animation: 'splashEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Ícone / Emblema Grande com Pulso */}
        <div
          style={{
            marginBottom: 28,
            transform: 'scale(1)',
            animation: 'pulseEmblem 2.5s ease-in-out infinite'
          }}
        >
          <ComunicarLogo size={110} showText={false} />
        </div>

        {/* Eyebrow Oficial do Site */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 9999,
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14
          }}
        >
          <Sparkles size={12} />
          <span>ESTRATÉGIAS QUE GERAM RESULTADOS</span>
        </div>

        {/* Marca: COMUNICAR MARKETING */}
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: 4
          }}
        >
          COMUNICAR{' '}
          <span
            style={{
              color: '#fbbf24',
              display: 'inline-block',
              letterSpacing: '0.14em'
            }}
          >
            MARKETING
          </span>
        </h1>

        {/* Subtítulo da Aplicação */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 16
          }}
        >
          <span>NFC CONNECT</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
          <span style={{ color: '#94a3b8', fontSize: 13, textTransform: 'none' }}>
            App Operacional & Comercial
          </span>
        </div>

        {/* Slogan Principal do Site */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.3,
            marginBottom: 8
          }}
        >
          Marketing que{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #fde047 0%, #fbbf24 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            impulsiona negócios
          </span>
        </div>

        {/* Slogan da Placa NFC */}
        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            lineHeight: 1.5,
            marginBottom: 36,
            maxWidth: 340
          }}
        >
          "Conecte seu negócio ao cliente com um toque."
        </p>

        {/* Barra de Carregamento Estilizada em Ouro */}
        <div
          style={{
            width: '100%',
            maxWidth: 220,
            height: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 9999,
            overflow: 'hidden',
            marginBottom: 18,
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
              animation: 'loadProgress 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          />
        </div>

        {/* Botão de Pular / Acessar Imediato */}
        <button
          onClick={handleSkip}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
        >
          <span>Acessar aplicativo</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <style>{`
        @keyframes splashEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseEmblem {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.3)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 28px rgba(251, 191, 36, 0.55)); }
        }
        @keyframes loadProgress {
          0% { width: 0%; }
          40% { width: 65%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
