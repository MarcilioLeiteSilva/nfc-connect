# NFC CONNECT — Plano de Projeto e Execução Técnica
**Cliente:** Comunicar Marketing  
**Aplicação:** Aplicativo Operacional e Comercial NFC CONNECT  
**Slogan:** *"Conecte seu negócio ao cliente com um toque."*  
**Documento Base:** `relatorios/NFC_CONNECT_Especificacao_Completa_App_Comunicar_Marketing_Programador.pdf`  
**Data:** Outubro de 2026  

---

## 1. Visão Geral e Objetivo
O **NFC CONNECT** é um sistema composto por aplicativo mobile (Flutter) e painel administrativo web, projetado para organizar e gerenciar em tempo real a operação dos parceiros comerciais que vendem e ativam as placas NFC inteligentes (Google Avaliações e Instagram).

O sistema elimina controles manuais e planilhas paralelas, garantindo governança total sobre o estoque físico distribuído, histórico de vendas, comissões geradas e metas.

---

## 2. A "Regra de Ouro" da Operação

| Perfil | Permissões de Estoque | Registro de Vendas |
| :--- | :--- | :--- |
| **Administrador** | **Controle exclusivo do estoque enviado.** É o único que cadastra, ajusta ou corrige remessas enviadas aos vendedores. | **Não cadastra vendas no lugar do vendedor**, evitando duplicidade. |
| **Vendedor** | **Apenas consulta.** Visualiza saldo disponível e histórico de remessas. Não tem acesso a botões de edição ou correção de estoque. | **Registra suas próprias vendas** após a configuração e teste da placa no estabelecimento. |

> **Transação Atômica do Sistema:**  
> Vendedor Registra Venda $\rightarrow$ Sistema valida saldo $\rightarrow$ Baixa estoque automaticamente $\rightarrow$ Gera comissão de R$ 20 $\rightarrow$ Atualiza metas e indicadores $\rightarrow$ Admin visualiza instantaneamente.

---

## 3. Regras de Negócio e Parâmetros

* **Produtos:** 2 modelos com controle de estoque totalmente independente:
  1. *Placa NFC Google*
  2. *Placa NFC Instagram*
* **Preço Padrão de Venda:** R$ 90,00 por placa.
* **Comissão Padrão do Vendedor:** R$ 20,00 por placa vendida e ativada ($Quantidade \times R\$\,20$).
* **Fórmula do Estoque Disponível:**  
  $$\text{Estoque Disponível} = \text{Total Enviado} \pm \text{Correções} - \text{Total Vendido (não estornado)}$$
  Na prática, é a soma de `stock_movements` por vendedor e produto (fonte única da verdade).
* **Correções de Estoque:** o admin nunca edita nem apaga uma remessa. Corrige com um lançamento de ajuste (`CORRECTION`, positivo ou negativo, com motivo obrigatório). O ajuste é recusado se deixar o saldo negativo.
* **Estorno de Venda:** apenas o admin pode estornar. A venda passa para `CANCELLED`, o estoque volta (`IN_REVERSAL`), a comissão é anulada e fica registrado quem estornou, quando e por quê.
* **Meta Mensal:** mês calendário (dia 1 ao último dia, fuso America/Sao_Paulo), contando pela `sale_date`. Considera apenas vendas `ACTIVE`, ou seja, sincronizadas e não estornadas.
* **Comissões:** apuradas por vendedor e por mês, com status `PENDING` ou `PAID`. Só o admin marca como paga, registrando data e responsável. Estorno de venda de um mês já pago gera um desconto (valor negativo) na apuração do mês seguinte.
* **Alerta de Estoque Baixo:** dispara quando o saldo de qualquer produto do vendedor é menor ou igual ao `low_stock_threshold` do próprio vendedor (padrão 5).
* **Critério para Venda:**
  * Quantidade $> 0$ e menor ou igual ao estoque disponível do produto.
  * Validações obrigatórias no momento da venda: *NFC configurado (Sim)* e *QR Code testado (Sim)*.
* **Modo Offline (vendas):** o vendedor pode registrar vendas sem sinal. A venda fica numa fila local do aparelho (`PENDING_SYNC`) e sincroniza automaticamente quando houver conexão.
  * O app debita o saldo de forma provisória no aparelho, para impedir que o vendedor lance mais do que tem.
  * A sincronização é idempotente (`client_request_id` único), então reenvios não duplicam a venda.
  * O servidor revalida o saldo na sincronização. Se for recusada (ex.: saldo reduzido por uma correção do admin), a venda vira `SYNC_REJECTED`, o vendedor é avisado e nenhuma comissão é gerada.
  * Comissão, metas e indicadores consideram apenas vendas sincronizadas. A fila local indica quantas vendas aguardam sincronização.
  * Consultas de estoque, histórico e materiais mostram o último dado em cache, com aviso de “última atualização”.
* **Tempo Real (admin):** o painel recebe vendas, estornos e mudanças de saldo por WebSocket (com reconexão automática e atualização completa ao reconectar).
* **Fora de Escopo do MVP (v1):** CRM completo, pipeline de leads, agenda de visitas, follow-ups e marketplace.

---

## 4. Arquitetura de Infraestrutura (VPS EasyPanel)

```
   [ App Mobile Flutter ]  (Vendedores em campo - Android/iOS)
   [ App Web Flutter    ]  (Administrador no PC / Navegador)
            │
            ▼  HTTPS / REST / WebSocket
  ┌─────────────────── VPS EASYPANEL ───────────────────┐
  │  [ Traefik / SSL Let's Encrypt Automático ]         │
  │                     │                               │
  │                     ▼                               │
  │  [ Backend API (Node.js / NestJS + TypeORM)  ]     │
  │                     │                               │
  │                     ▼                               │
  │  [ Banco de Dados Relacional (PostgreSQL) ]         │
  └─────────────────────────────────────────────────────┘
```

---

## 5. Estrutura e Modelo de Dados

### 5.1. `users` (Usuários do Sistema)
* `id` (UUID, PK)
* `name` (VARCHAR)
* `email` (VARCHAR, Unique)
* `password_hash` (VARCHAR)
* `phone` (VARCHAR)
* `role` (ENUM: `'ADMIN'`, `'SELLER'`)
* `status` (ENUM: `'ACTIVE'`, `'INACTIVE'`)
* `monthly_target` (INT, default 20)
* `low_stock_threshold` (INT, default 5)
* `must_change_password` (BOOLEAN, default true, força troca no primeiro acesso)
* `failed_login_attempts` (INT, default 0), `locked_until` (TIMESTAMP, nullable)
* `token_version` (INT, default 0, incluso no JWT; ao incrementar, todos os tokens antigos do usuário deixam de valer)
* `consent_accepted_at` (TIMESTAMP, nullable, aceite do termo de uso e privacidade)
* `created_at`, `updated_at` (TIMESTAMP)

### 5.2. `products` (Catálogo de Placas)
* `id` (UUID, PK)
* `name` (VARCHAR: `'Google'`, `'Instagram'`)
* `sku` (VARCHAR)
* `unit_price` (DECIMAL, default 90.00)
* `commission_unit` (DECIMAL, default 20.00)
* `is_active` (BOOLEAN)

### 5.3. `stock_shipments` (Envios de Estoque pelo Admin)
* `id` (UUID, PK)
* `seller_id` (UUID, FK $\rightarrow$ users.id)
* `product_id` (UUID, FK $\rightarrow$ products.id)
* `quantity` (INT)
* `shipment_date` (DATE)
* `notes` (TEXT, opcional)
* `created_by` (UUID, FK $\rightarrow$ users.id - Admin)
* `created_at` (TIMESTAMP)

### 5.4. `stock_movements` (Histórico de Movimentações)
* `id` (UUID, PK)
* `seller_id` (UUID, FK $\rightarrow$ users.id)
* `product_id` (UUID, FK $\rightarrow$ products.id)
* `type` (ENUM: `'IN_SHIPMENT'`, `'OUT_SALE'`, `'IN_REVERSAL'`, `'CORRECTION'`)
* `quantity` (INT, com sinal: entradas positivas, saídas negativas)
* `shipment_id` (UUID, FK nullable → stock_shipments.id)
* `sale_id` (UUID, FK nullable → sales.id)
* `reason` (TEXT, obrigatório em `CORRECTION`)
* `created_by` (UUID, FK → users.id)
* *Constraint:* exatamente um entre `shipment_id` e `sale_id`, ou nenhum no caso de `CORRECTION`. Registros são imutáveis (append-only).
* `created_at` (TIMESTAMP)

### 5.5. `sales` (Registro de Vendas)
* `id` (UUID, PK)
* `seller_id` (UUID, FK $\rightarrow$ users.id)
* `product_id` (UUID, FK $\rightarrow$ products.id)
* `establishment_name` (VARCHAR)
* `quantity` (INT)
* `unit_price` (DECIMAL, default 90.00)
* `total_price` (DECIMAL)
* `commission_amount` (DECIMAL)
* `nfc_configured` (BOOLEAN, deve ser true)
* `qrcode_tested` (BOOLEAN, deve ser true)
* `sale_date` (TIMESTAMP, data/hora em que o vendedor registrou no aparelho)
* `synced_at` (TIMESTAMP, quando o servidor recebeu e validou)
* `client_request_id` (UUID, Unique, gerado no app, garante idempotência)
* `status` (ENUM: `'ACTIVE'`, `'CANCELLED'`, `'SYNC_REJECTED'`, default `'ACTIVE'`; `PENDING_SYNC` existe apenas na fila local do app)
* `cancelled_by` (UUID, FK → users.id, nullable)
* `cancelled_at` (TIMESTAMP, nullable)
* `cancel_reason` (TEXT, obrigatório se `CANCELLED`)

### 5.6. `support_materials` (Materiais de Apoio)
* `id` (UUID, PK)
* `code` (VARCHAR: `'01'`, `'02'`, etc.)
* `title` (VARCHAR)
* `category` (VARCHAR)
* `url` (VARCHAR)
* `display_order` (INT)

### 5.7. `commission_statements` (Apuração Mensal de Comissões)
* `id` (UUID, PK)
* `seller_id` (UUID, FK → users.id)
* `reference_month` (CHAR(7), formato `'YYYY-MM'`)
* `total_amount` (DECIMAL, soma das comissões do mês, já com descontos de estornos)
* `status` (ENUM: `'PENDING'`, `'PAID'`, default `'PENDING'`)
* `paid_at` (TIMESTAMP, nullable), `paid_by` (UUID, FK → users.id, nullable)
* *Constraint:* Unique (`seller_id`, `reference_month`). O valor é fixado quando o admin marca como paga.

---

## 6. As 10 Fases de Execução

### **Fase 1: Infraestrutura & Setup no EasyPanel**
- Subir contêiner de banco de dados (PostgreSQL) no EasyPanel com persistência de volumes.
- Criar a aplicação backend Dockerizada e mapear porta/domínio com SSL automático (Let's Encrypt).
- Definir variáveis de ambiente seguras (`DATABASE_URL`, `JWT_SECRET`).
- Configurar backup diário automático do PostgreSQL (com retenção definida e cópia fora da VPS) e testar a restauração.
- Criar repositório e pipeline CI/CD (GitHub Actions): a cada push executa lint e testes. Na branch principal, builda a imagem Docker e faz deploy no EasyPanel (ambientes de homologação e produção separados).

### **Fase 2: Modelagem de Dados & Transações ACID**
- Implementar as migrações de banco (`users`, `products`, `stock_shipments`, `stock_movements`, `sales`, `support_materials`, `commission_statements`).
- Criar a procedure ou transação atômica de venda:
  - Valida se o vendedor está ativo.
  - Valida se `Estoque Disponível >= Quantidade`.
  - Registra a venda em `sales`.
  - Gera a saída em `stock_movements`.
  - Bloqueia a linha de saldo (`SELECT ... FOR UPDATE`) para evitar saldo negativo em vendas simultâneas.
  - Retorna confirmação e saldo atualizado.
  - Idempotente: se `client_request_id` já existir, retorna a venda original sem duplicar.
  - Se o saldo for insuficiente na sincronização, registra `SYNC_REJECTED` sem gerar movimento nem comissão.
- Criar a transação de estorno (admin): marca a venda como `CANCELLED`, gera `IN_REVERSAL` e anula a comissão.
- Criar a transação de correção de estoque (admin): gera `CORRECTION` com motivo e valida que o saldo não fica negativo.
- **Testes automatizados (obrigatórios para concluir a fase):** venda válida; venda acima do saldo; duas vendas simultâneas com saldo para apenas uma; reenvio com o mesmo `client_request_id`; estorno devolvendo estoque e anulando comissão; correção que deixaria saldo negativo; saldo igual à soma de `stock_movements`.

### **Fase 3: Autenticação & Regras Rígidas de Segurança**
- Autenticação com JWT de longa duração (7 dias), sem refresh token, para simplificar o app.
  - Mitigação: o guard consulta `users.status` a cada requisição. Vendedor desativado perde o acesso na hora, mesmo com token válido.
  - Invalidação de tokens: o JWT carrega `token_version`, e o guard recusa (401) se for diferente do valor em `users`. O valor é incrementado ao redefinir a senha, ao desativar o vendedor, na troca de senha pelo próprio vendedor e na ação "Encerrar sessões" do admin. Cobre roubo e perda do aparelho sem desativar o vendedor.
  - No app, token expirado com vendas na fila exige novo login antes de sincronizar. A fila local não é apagada.
- Rate limit e bloqueio no login: máximo de 5 tentativas erradas, com bloqueio temporário (15 min), e limite de requisições por IP.
- Troca de senha obrigatória no primeiro acesso (`must_change_password`) e senhas com hash (bcrypt/argon2).
- Recuperação de senha: o admin redefine a senha do vendedor, gerando uma senha temporária com troca obrigatória.
- Middlewares de autorização por papel (`AdminOnlyGuard`, `SellerGuard`).
- Bloqueio completo na API: vendedores não têm permissão para chamar endpoints de inserção ou alteração de estoque enviado.
- Endpoint de versão mínima do app (`GET /app/version`): o app compara sua versão e, se estiver abaixo da mínima, bloqueia o uso e leva o vendedor ao link de atualização. Vendas já na fila local não são perdidas.
- **Testes automatizados (obrigatórios para concluir a fase):** vendedor chamando endpoints de admin (remessa, correção, estorno, comissão) recebe 403; vendedor desativado perde acesso imediato; bloqueio após 5 tentativas de login; troca de senha obrigatória; token antigo recebe 401 após incremento de `token_version` (redefinição de senha ou "Encerrar sessões").

### **Fase 4: Setup do Projeto Flutter & Design System**
- Inicialização do projeto Flutter com arquitetura modular (Clean Architecture / Feature-First).
- Configuração de gerenciamento de estado (Riverpod ou Bloc).
- Implementação do Design System oficial (cores, tipografia, botões, inputs, cards de métricas e estados de feedback tátil).
- Configuração do cliente HTTP com interceptores automáticos de autenticação e tratamento de erros de conexão.
- Banco local (ex.: Drift) para cache de leitura e fila de vendas pendentes, **criptografado** (SQLCipher), com sincronização automática em segundo plano e retentativas com backoff. A chave de criptografia fica no armazenamento seguro do sistema.
- Armazenamento seguro: o token e a chave do banco ficam no `flutter_secure_storage` (Keystore no Android, Keychain no iOS), nunca em texto simples.
- Bloqueio do app (`local_auth`): ao abrir e ao voltar do segundo plano após 2 minutos, o app exige biometria ou PIN do aparelho. Após 30 minutos de inatividade ou 5 falhas seguidas, exige a senha completa.
- Aviso ao vendedor para manter o bloqueio de tela do celular ativo. O app avisa na tela de login se o aparelho não tiver bloqueio configurado.
- Cliente WebSocket no painel admin, com reconexão automática.

### **Fase 5: Módulo do Administrador — Gestão de Vendedores**
- Lista de vendedores com indicadores de performance, status e filtros.
- Tela de cadastro e edição de vendedor (nome, e-mail, telefone, meta inicial e limite de alerta de estoque).
- Termo de uso e política de privacidade (LGPD) exibidos no primeiro acesso, com aceite registrado em `consent_accepted_at`. Coleta apenas dos dados necessários (nome, e-mail e telefone).
- Ação de redefinir senha do vendedor (senha temporária). A redefinição também encerra todas as sessões ativas (`token_version`).
- Ação "Encerrar sessões" (aparelho perdido ou roubado): invalida todos os tokens do vendedor sem desativar a conta nem alterar a senha.
- Ação de ativar/desativar vendedor preservando a integridade de todas as vendas e histórico anteriores.

### **Fase 6: Módulo do Administrador — Controle de Estoque Enviado**
- Modal/Tela de lançamento de remessa de estoque: seleção do vendedor, quantidade Google, quantidade Instagram, data e observações.
- Histórico auditável de envios e movimentações. A correção é feita por lançamento de ajuste (com motivo), nunca editando a remessa original, com registro de data/hora do responsável.
- Tela de estorno de venda (admin) com motivo obrigatório.
- Painel consolidado de vendedores com estoque baixo, usando o `low_stock_threshold` de cada vendedor.
- Tela de comissões por mês e vendedor, com ação de marcar como paga.

### **Fase 7: Módulo do Vendedor — Dashboard, Estoque (Read-Only) e Metas**
- **Home do Vendedor:** Cards resumidos com vendas do mês, total faturado, comissão gerada e progresso da meta.
- **Tela de Consulta de Estoque:** Resumo visual de placas enviadas, vendidas e saldo disponível (Google e Instagram separados). **Sem botões de edição.**
- **Módulo de Comissões e Metas:** Barra de progresso visual do mês corrente (ex: 15 / 20 placas) e extrato de comissões por mês, com status Pendente ou Paga.

### **Fase 8: Módulo do Vendedor — Registro de Venda (Fluxo Crítico)**
- Formulário ágil:
  - Nome do estabelecimento.
  - Seleção de modelo (Google ou Instagram).
  - Quantidade (com exibição imediata do saldo disponível).
  - Cálculo automático do valor total ($Qtd \times R\$\,90$).
  - Validações com interruptores: *NFC configurado* e *QR Code testado*.
- Bloqueio na UI e no backend caso a quantidade solicitada exceda o estoque disponível (no offline, usa o saldo local provisório).
- Confirmação de segurança: antes de salvar a venda, o app pede biometria ou PIN do aparelho, para evitar vendas falsas por quem pegou o celular desbloqueado.
- Gera um `client_request_id` por venda e a coloca na fila local quando não há conexão.
- Feedback imediato: “Venda registrada” quando sincronizada, ou “Salva, aguardando sincronização” quando offline.
- Tela de vendas pendentes e rejeitadas, com o motivo da recusa.

### **Fase 9: Materiais de Apoio & Históricos Detalhados**
- Lista dos 8 materiais de apoio (Comece Aqui, Roteiro de Abordagem, Como Apresentar o Produto, Objeções e Respostas, Configuração NFC, Registro de Venda, Vídeo NFC CONNECT e Apresentação Comercial).
- Visualizador integrado de materiais (PDFs e links de vídeo).
- Histórico detalhado de vendas para o vendedor e para o administrador, com filtros por data e produto.

### **Fase 10: Testes de Aceite, Homologação & Publicação**
- Execução do checklist oficial de homologação:
  1. Admin cadastra vendedor "João".
  2. Admin lança envio de 20 placas Google para João.
  3. João faz login, visualiza 20 placas e não tem opção de editar o saldo.
  4. João registra 1 venda Google.
  5. Sistema baixa o estoque para 19 e gera R$ 20 de comissão.
  6. Admin visualiza a venda e os saldos atualizados em tempo real.
- Testes negativos e de borda:
  1. João tenta registrar quantidade acima do saldo e é bloqueado (UI e API).
  2. João tenta chamar endpoints de estoque via API e recebe 403.
  3. João registra venda sem sinal, a venda fica pendente e sincroniza sozinha ao reconectar, sem duplicar.
  4. Admin faz correção que reduz o saldo antes da sincronização, e a venda sem saldo vira `SYNC_REJECTED` e João é avisado.
  5. Admin estorna a venda, o estoque volta e a comissão é anulada.
  6. Admin desativa João e ele perde o acesso imediatamente.
  7. Versão do app abaixo da mínima é bloqueada e redireciona para atualização.
  8. Admin clica em "Encerrar sessões" e o app de João recebe 401 e volta ao login.
  9. App volta do segundo plano depois de 2 minutos e pede biometria ou PIN.
  10. Registrar venda exige confirmação por biometria ou PIN.
  11. Token e banco local não são legíveis fora do app (verificação de armazenamento seguro).
- Compilação e deploy do painel Admin Web no EasyPanel (Docker Nginx com SSL).
- Geração da versão mobile Android (APK assinado) e distribuição por link para os vendedores. Cada nova versão atualiza a versão mínima exigida pela API quando houver mudança incompatível.

---

## 7. Materiais de Apoio Padronizados (Cadastro Inicial)
1. `01` — Comece Aqui
2. `02` — Roteiro de Abordagem
3. `03` — Como Apresentar o Produto
4. `04` — Objeções e Respostas
5. `05` — Configuração NFC
6. `06` — Registro de Venda
7. `07` — Vídeo NFC CONNECT
8. `08` — Apresentação Comercial

---

## 8. Cronograma Estimado e Dependências

> Estimativas para 1 desenvolvedor backend e 1 Flutter trabalhando em paralelo. Com uma única pessoa, some as durações das trilhas.

| Fase | Duração | Depende de | Trilha |
| :--- | :--- | :--- | :--- |
| 1. Infraestrutura, backup e CI/CD | 3 dias | — | Backend |
| 2. Modelagem e transações + testes | 6 dias | 1 | Backend |
| 3. Autenticação, segurança, `token_version` + testes | 4,5 dias | 2 | Backend |
| 4. Setup Flutter, design system, banco local criptografado, bloqueio do app | 6 dias | 1 | Flutter (paralela às Fases 2 e 3) |
| 5. Admin: vendedores | 4 dias | 3 e 4 | Flutter |
| 6. Admin: estoque, estorno, comissões | 6 dias | 5 | Flutter |
| 7. Vendedor: dashboard, estoque, metas | 4 dias | 3 e 4 | Flutter (paralela à Fase 6) |
| 8. Vendedor: registro de venda e offline | 7 dias | 7 | Flutter |
| 9. Materiais e históricos | 3 dias | 7 | Flutter |
| 10. Homologação, ajustes e publicação | 5 dias | 6, 8 e 9 | Todos |

* **Prazo total estimado:** cerca de 6 a 7 semanas com duas trilhas em paralelo.
* **Marcos:**
  1. **M1:** backend seguro com testes aprovados (fim da Fase 3).
  2. **M2:** painel admin operacional (fim da Fase 6).
  3. **M3:** app do vendedor com venda offline (fim da Fase 8).
  4. **M4:** homologação aprovada e publicação (fim da Fase 10).
* **Risco principal:** a fila offline com sincronização (Fase 8). Se o prazo apertar, ela deve ser a primeira a receber mais tempo.
