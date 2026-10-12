import React from 'react';

interface ComunicarLogoProps {
  size?: number;
  showText?: boolean;
  tagline?: string;
}

export const ComunicarLogo: React.FC<ComunicarLogoProps> = ({
  size = 40,
  showText = true,
  tagline
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Emblema Oficial da Comunicar Marketing */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.35))' }}
      >
        <defs>
          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fde047" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Fundo do círculo */}
        <circle cx="50" cy="50" r="46" fill="#070e20" stroke="url(#logoGold)" strokeWidth="4.5" />

        {/* Ondas sutis de NFC no topo */}
        <path d="M40 18C43 16 47 15 50 15C53 15 57 16 60 18" stroke="url(#logoGold)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M35 12C40 9 45 8 50 8C55 8 60 9 65 12" stroke="url(#logoGold)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

        {/* 3 Barras brancas de crescimento */}
        <rect x="29" y="52" width="8.5" height="20" rx="2" fill="#ffffff" />
        <rect x="42.5" y="40" width="8.5" height="32" rx="2" fill="#ffffff" />
        <rect x="56" y="28" width="8.5" height="44" rx="2" fill="#ffffff" />

        {/* Seta dourada ascendente oficial */}
        <path
          d="M25 54 L45 38 L57 47 L76 22"
          stroke="url(#logoGold)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ponta da seta */}
        <polygon points="80,18 70,23 74,28" fill="url(#logoGold)" />
      </svg>

      {/* Tipografia Oficial da Marca */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: size * 0.36, fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
              COMUNICAR
            </span>
            <span
              style={{
                fontSize: size * 0.22,
                fontWeight: 800,
                color: '#070e20',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                padding: '1px 6px',
                borderRadius: 4,
                letterSpacing: '0.04em'
              }}
            >
              NFC
            </span>
          </div>

          <span
            style={{
              fontSize: size * 0.24,
              fontWeight: 800,
              color: '#fbbf24',
              letterSpacing: '0.22em',
              textTransform: 'uppercase'
            }}
          >
            MARKETING
          </span>

          {tagline && (
            <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
