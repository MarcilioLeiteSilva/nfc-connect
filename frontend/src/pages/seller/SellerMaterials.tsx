import React, { useState } from 'react';
import type { SupportMaterial } from '../../types';
import { storageService } from '../../services/storageService';
import {
  ChevronRight,
  Sparkles,
  X,
  FileText,
  Video,
  CheckCircle2
} from 'lucide-react';

export const SellerMaterials: React.FC = () => {
  const materials = storageService.getSupportMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState<SupportMaterial | null>(null);

  return (
    <div className="main-content animate-fade-in">
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
          Biblioteca do Vendedor
        </span>
        <h1 style={{ fontSize: 22, marginTop: 2 }}>Materiais de Apoio</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Os 8 guias oficiais para abordagem, quebra de objeções e ativação técnica.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {materials.map(mat => {
          const isVideo = mat.id === 'mat-07';

          return (
            <div
              key={mat.id}
              onClick={() => setSelectedMaterial(mat)}
              className="glass-panel"
              style={{
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: isVideo ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: isVideo ? '#f87171' : '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isVideo ? <Video size={20} /> : <FileText size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--primary-light)'
                      }}
                    >
                      #{mat.code}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{mat.category}</span>
                  </div>
                  <h3 style={{ fontSize: 14, color: '#fff', marginTop: 2 }}>{mat.title}</h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                <span style={{ fontSize: 11 }}>{mat.readTime}</span>
                <ChevronRight size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Leitor de Material */}
      {selectedMaterial && (
        <div className="modal-overlay" onClick={() => setSelectedMaterial(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'var(--primary-glow)',
                    color: 'var(--primary-light)'
                  }}
                >
                  #{selectedMaterial.code}
                </span>
                <span className="badge badge-info" style={{ fontSize: 11 }}>
                  {selectedMaterial.category}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedMaterial(null)}>
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: 18, color: '#fff', marginBottom: 12 }}>
              {selectedMaterial.title}
            </h2>

            <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 16 }}>
              {selectedMaterial.description}
            </p>

            {/* Resumo executivo */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: 14,
                marginBottom: 16
              }}
            >
              <h4 style={{ fontSize: 13, color: 'var(--primary-light)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Resumo Prático de Aplicação
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {selectedMaterial.summary}
              </p>
            </div>

            {/* Pontos-chave */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: '#fff', marginBottom: 10 }}>Pontos-Chave para o Vendedor:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedMaterial.keyPoints.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                    <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: 'var(--text-main)' }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => setSelectedMaterial(null)}>
              Fechar Material
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
