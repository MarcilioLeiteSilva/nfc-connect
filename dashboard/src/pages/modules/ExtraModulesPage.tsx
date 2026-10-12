import React from 'react';
import type { Sale, User } from '../../types';
import {
  Building2,
  Nfc,
  BookOpen,
  Shield,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileText
} from 'lucide-react';
import type { NavTab } from '../../components/layout/Sidebar';

interface ExtraModulesPageProps {
  currentTab: NavTab;
  sales: Sale[];
  users: User[];
}

export const ExtraModulesPage: React.FC<ExtraModulesPageProps> = ({
  currentTab,
  sales,
  users
}) => {
  const userMap = new Map(users.map(u => [u.id, u.name]));

  // 1. MÓDULO CRM: Lojistas e Estabelecimentos
  if (currentTab === 'crm') {
    // Agrupa estabelecimentos únicos a partir das vendas
    const establishmentsMap = new Map<string, {
      name: string;
      platesCount: number;
      hasGoogle: boolean;
      hasInsta: boolean;
      sellerName: string;
      lastDate: string;
    }>();

    sales.filter(s => s.status === 'ACTIVE').forEach(s => {
      const existing = establishmentsMap.get(s.establishment_name);
      const isGoogle = s.product_id === 'google';
      const isInsta = s.product_id === 'instagram';

      if (!existing) {
        establishmentsMap.set(s.establishment_name, {
          name: s.establishment_name,
          platesCount: s.quantity,
          hasGoogle: isGoogle,
          hasInsta: isInsta,
          sellerName: userMap.get(s.seller_id) || s.seller_id,
          lastDate: s.sale_date
        });
      } else {
        existing.platesCount += s.quantity;
        if (isGoogle) existing.hasGoogle = true;
        if (isInsta) existing.hasInsta = true;
      }
    });

    const establishments = Array.from(establishmentsMap.values());

    return (
      <div className="page-content animate-fade-in">
        <div className="table-card">
          <div className="table-header-box">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="var(--primary-light)" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Base de Estabelecimentos & Lojistas (CRM)
                </h2>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                {establishments.length} comércio(s) atendidos pela Comunicar Marketing
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Estabelecimento</th>
                  <th>Placas Instaladas</th>
                  <th>Mix de Produtos</th>
                  <th>Vendedor Responsável</th>
                  <th>Oportunidade Comercial (Upsell)</th>
                </tr>
              </thead>
              <tbody>
                {establishments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                      Nenhum estabelecimento registrado ainda. Conforme as vendas forem realizadas, a base será preenchida automaticamente.
                    </td>
                  </tr>
                ) : (
                  establishments.map((est, i) => {
                    const needsInsta = est.hasGoogle && !est.hasInsta;
                    const needsGoogle = !est.hasGoogle && est.hasInsta;

                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>
                            {est.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            Última ativação: {new Date(est.lastDate).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                            {est.platesCount} un.
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {est.hasGoogle && (
                              <span className="badge badge-info" style={{ fontSize: 11 }}>
                                Google 5★
                              </span>
                            )}
                            {est.hasInsta && (
                              <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', fontSize: 11 }}>
                                Instagram
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {est.sellerName}
                          </span>
                        </td>
                        <td>
                          {needsInsta ? (
                            <span className="badge badge-warning" style={{ gap: 4 }}>
                              <Sparkles size={11} /> Oferecer Placa Instagram
                            </span>
                          ) : needsGoogle ? (
                            <span className="badge badge-warning" style={{ gap: 4 }}>
                              <Sparkles size={11} /> Oferecer Placa Google
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              <CheckCircle size={11} /> Cliente Completo (Google + Instagram)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÓDULO NFC: Catálogo & Tecnologia
  if (currentTab === 'nfc') {
    return (
      <div className="page-content animate-fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="table-card" style={{ padding: 24, gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: 10, borderRadius: 'var(--radius-md)' }}>
                <Nfc size={22} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Placa NFC Google Avaliações</h3>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>SKU: NFC-GOOG-01</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Chip NTAG215 embutido em acrílico preto piano com gravação de link direto do Google Meu Negócio. Induz avaliações 5 estrelas no balcão do lojista.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Preço ao Lojista</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>R$ 90,00</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Comissão do Vendedor</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>R$ 20,00</div>
              </div>
            </div>
          </div>

          <div className="table-card" style={{ padding: 24, gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: 10, borderRadius: 'var(--radius-md)' }}>
                <Nfc size={22} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Placa NFC Instagram Direct</h3>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>SKU: NFC-INSTA-01</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Chip NTAG215 com link direto para o perfil do Instagram da loja, facilitando seguidores, envio de mensagens diretas e marcação em stories.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Preço ao Lojista</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>R$ 90,00</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Comissão do Vendedor</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>R$ 20,00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MÓDULO MATERIAIS: Capacitação da Equipe
  if (currentTab === 'materials') {
    return (
      <div className="page-content animate-fade-in">
        <div className="table-card" style={{ padding: 24, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={20} color="var(--primary-light)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Materiais de Apoio & Treinamentos de Campo
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Estes módulos de capacitação estão sincronizados e disponíveis no aplicativo dos vendedores.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-main)' }}>
                <FileText size={16} color="var(--primary-light)" />
                <span>01 — Guia do Parceiro Comercial</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                Manual de boas-vindas, entendimento do modelo de negócio e mentalidade de venda no balcão.
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-main)' }}>
                <FileText size={16} color="var(--primary-light)" />
                <span>02 — Roteiro de Abordagem Presencial</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                Pitch de 45 segundos para quebrar barreiras com recepcionistas e falar direto com o decisor.
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-main)' }}>
                <FileText size={16} color="var(--primary-light)" />
                <span>03 — Objeções & Respostas Prontas</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                Como contornar: "Tá caro", "Já tenho QR Code em papel" e "Preciso falar com o sócio".
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. MÓDULO SEGURANÇA & AUDITORIA
  return (
    <div className="page-content animate-fade-in">
      <div className="table-card" style={{ padding: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#10b981" />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Painel de Segurança & Logs de Acesso
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>AUTENTICAÇÃO JWT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 4 }}>
              Assinatura Segura Ativa (HMAC-SHA256)
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>ISOLAMENTO DE SESSÕES</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
              Controle por Token Version
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>BANCO DE DADOS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
              PostgreSQL Relacional com Transações Atômicas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
