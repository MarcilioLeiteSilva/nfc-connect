import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncNow: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingSyncCount,
  onSyncNow
}) => {
  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div className="offline-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <WifiOff size={16} />
        <span>
          {!isOnline
            ? `Sem internet. Suas vendas ficam salvas no celular!`
            : `${pendingSyncCount} venda(s) pronta(s) para sincronizar.`}
        </span>
      </div>
      <button onClick={onSyncNow} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <RefreshCw size={12} />
        <span>Sincronizar</span>
      </button>
    </div>
  );
};
