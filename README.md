# NFC CONNECT — Aplicação Comercial e Operacional

> *"Conecte seu negócio ao cliente com um toque."*  
> Cliente: Comunicar Marketing

---

## 📱 Acesso Universal (Mobile-First / PWA)

A aplicação foi desenvolvida em formato **PWA (Progressive Web App)** para ser acessada instantaneamente por **qualquer celular (iPhone no Safari ou Android no Chrome)**, sem necessidade de publicação nas lojas de aplicativos (App Store / Google Play).

### Como Rodar e Testar no seu Celular:

1. **Servidor Local Ativo:**
   - Acesse no computador: `http://localhost:5173/`
   - Acesse no **celular (na mesma rede Wi-Fi)**: `http://192.168.0.151:5173/`

2. **Como Instalar como App no Celular:**
   - **No iPhone (iOS):** Abra no Safari $\rightarrow$ Toque no ícone de Compartilhar $\rightarrow$ Selecione **"Adicionar à Tela de Início"**.
   - **No Android:** Abra no Chrome $\rightarrow$ Toque nos 3 pontinhos $\rightarrow$ Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

---

## 🚀 Funcionalidades Implementadas

### Módulo do Vendedor (Mobile)
- **Dashboard / Home:** Progresso da meta mensal (ex: 20 placas), comissão acumulada (R$ 20/placa) e faturamento total (R$ 90/placa).
- **Estoque (Regra de Ouro — Read-Only):** Consulta de saldos das Placas Google e Instagram, total enviado, total vendido e histórico de movimentações (sem botões de edição para o vendedor).
- **Registro de Venda Rápido:** Seleção do produto, cálculo automático de valor e comissões, validação de saldo e checklist com interruptores obrigatórios (*NFC gravado* e *QR Code testado*).
- **Extrato:** Histórico completo de vendas ativas e status das comissões (Pendente / Paga).
- **Apoio Comercial:** Os 8 manuais de treinamento oficiais da Comunicar Marketing integrados em um leitor in-app.

### Módulo do Administrador (Executivo)
- **Painel Global:** Métricas consolidadas da equipe e alertas automáticos de vendedores com estoque crítico.
- **Controle de Estoque & Remessas:** Lançamento de novas remessas e correções auditadas com motivo obrigatório (não permite deixar saldo negativo).
- **Gestão de Vendedores:** Cadastro, alteração de metas/limites de alerta, ativação/desativação e encerramento de sessões.
- **Comissões & Estornos:** Fechamento mensal de pagamentos e estorno auditado de vendas com devolução de produto ao estoque.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite + PWA
- **Estilização:** Vanilla CSS Mobile-First com Design System moderno (Dark Mode, Glassmorphism, Safe-Area insets)
- **Ícones & UX:** Lucide React + Micro-animações táteis
- **Armazenamento:** LocalStorage Reativo com suporte a fila offline e sincronização automática

---

## 🖥️ Painel Administrativo Web Desktop (`/dashboard`)

Painel executivo completo para gestão da operação, força de vendas, comissões, estoque e inteligência comercial:

### Como Rodar o Dashboard:
```bash
cd dashboard
npm install
npm run dev
```
Acesse no navegador: **`http://localhost:5174/`**

### Módulos Integrados:
1. **Visão Geral Executiva:** Faturamento bruto, lucro operacional líquido, comissões a pagar, placas ativas e ranking da equipe.
2. **Gestão de Vendas & Auditoria:** Histórico com filtros dinâmicos, estornos auditados e exportação de relatórios em CSV.
3. **Gestão de Vendedores:** Cadastro completo, chaves Pix, metas mensais e controle de sessões.
4. **Controle de Estoque & Remessas:** Saldo em posse de vendedores e envio de novos lotes de placas.
5. **Comissões & Central de Pagamentos:** Fechamento mensal, cópia rápida de Pix e DRE simplificado da operação.
6. **CRM de Lojistas:** Base de estabelecimentos atendidos e identificação de oportunidades de venda cruzada (Upsell).
7. **Catálogo & Tecnologia NFC:** Especificações técnicas das placas Google e Instagram.
8. **Materiais de Apoio:** Manuais de capacitação da equipe.
9. **Segurança & Auditoria:** Monitoramento de acessos e integridade do banco.
