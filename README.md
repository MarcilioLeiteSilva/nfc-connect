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
