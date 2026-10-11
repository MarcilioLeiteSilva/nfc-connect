import type { Product, SupportMaterial, User, Sale, StockMovement } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'google',
    name: 'Placa NFC Google',
    badge: 'Avaliações 5 Estrelas',
    sku: 'NFC-GOOG-01',
    unit_price: 90.0,
    commission_unit: 20.0,
    accent_color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
    icon: 'Star'
  },
  {
    id: 'instagram',
    name: 'Placa NFC Instagram',
    badge: 'Seguidores & Direct',
    sku: 'NFC-INSTA-01',
    unit_price: 90.0,
    commission_unit: 20.0,
    accent_color: '#ec4899',
    gradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    icon: 'Instagram'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Carlos Gestor',
    email: 'admin@comunicarmarketing.com.br',
    phone: '(11) 98765-4321',
    role: 'ADMIN',
    status: 'ACTIVE',
    monthly_target: 100,
    low_stock_threshold: 10,
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-seller-1',
    name: 'João Silva',
    email: 'joao.silva@comunicarmarketing.com.br',
    phone: '(11) 99123-4567',
    role: 'SELLER',
    status: 'ACTIVE',
    monthly_target: 20,
    low_stock_threshold: 5,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-seller-2',
    name: 'Mariana Costa',
    email: 'mariana.costa@comunicarmarketing.com.br',
    phone: '(11) 98234-5678',
    role: 'SELLER',
    status: 'ACTIVE',
    monthly_target: 25,
    low_stock_threshold: 5,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-seller-3',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@comunicarmarketing.com.br',
    phone: '(11) 97345-6789',
    role: 'SELLER',
    status: 'ACTIVE',
    monthly_target: 20,
    low_stock_threshold: 4,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    seller_id: 'user-seller-1',
    product_id: 'google',
    type: 'IN_SHIPMENT',
    quantity: 25,
    reason: 'Remessa Inicial de Outubro',
    created_by: 'user-admin',
    created_at: '2026-10-01T09:00:00Z'
  },
  {
    id: 'mov-2',
    seller_id: 'user-seller-1',
    product_id: 'instagram',
    type: 'IN_SHIPMENT',
    quantity: 20,
    reason: 'Remessa Inicial de Outubro',
    created_by: 'user-admin',
    created_at: '2026-10-01T09:00:00Z'
  },
  {
    id: 'mov-3',
    seller_id: 'user-seller-1',
    product_id: 'google',
    type: 'OUT_SALE',
    quantity: -1,
    sale_id: 'sale-1',
    created_by: 'user-seller-1',
    created_at: '2026-10-03T14:30:00Z'
  },
  {
    id: 'mov-4',
    seller_id: 'user-seller-1',
    product_id: 'google',
    type: 'OUT_SALE',
    quantity: -2,
    sale_id: 'sale-2',
    created_by: 'user-seller-1',
    created_at: '2026-10-05T11:15:00Z'
  },
  {
    id: 'mov-5',
    seller_id: 'user-seller-1',
    product_id: 'instagram',
    type: 'OUT_SALE',
    quantity: -1,
    sale_id: 'sale-3',
    created_by: 'user-seller-1',
    created_at: '2026-10-06T16:45:00Z'
  },
  {
    id: 'mov-6',
    seller_id: 'user-seller-2',
    product_id: 'google',
    type: 'IN_SHIPMENT',
    quantity: 15,
    reason: 'Remessa Lote 2',
    created_by: 'user-admin',
    created_at: '2026-10-02T10:00:00Z'
  },
  {
    id: 'mov-7',
    seller_id: 'user-seller-2',
    product_id: 'instagram',
    type: 'IN_SHIPMENT',
    quantity: 6,
    reason: 'Remessa Lote 2',
    created_by: 'user-admin',
    created_at: '2026-10-02T10:00:00Z'
  },
  {
    id: 'mov-8',
    seller_id: 'user-seller-2',
    product_id: 'instagram',
    type: 'OUT_SALE',
    quantity: -3,
    sale_id: 'sale-4',
    created_by: 'user-seller-2',
    created_at: '2026-10-08T15:20:00Z'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    seller_id: 'user-seller-1',
    seller_name: 'João Silva',
    product_id: 'google',
    establishment_name: 'Café & Bistrô Central',
    quantity: 1,
    unit_price: 90.0,
    total_price: 90.0,
    commission_amount: 20.0,
    nfc_configured: true,
    qrcode_tested: true,
    sale_date: '2026-10-03T14:30:00Z',
    synced_at: '2026-10-03T14:30:05Z',
    client_request_id: 'req-001',
    status: 'ACTIVE'
  },
  {
    id: 'sale-2',
    seller_id: 'user-seller-1',
    seller_name: 'João Silva',
    product_id: 'google',
    establishment_name: 'Auto Mecânica Express (Balcão e Caixa)',
    quantity: 2,
    unit_price: 90.0,
    total_price: 180.0,
    commission_amount: 40.0,
    nfc_configured: true,
    qrcode_tested: true,
    sale_date: '2026-10-05T11:15:00Z',
    synced_at: '2026-10-05T11:15:10Z',
    client_request_id: 'req-002',
    status: 'ACTIVE'
  },
  {
    id: 'sale-3',
    seller_id: 'user-seller-1',
    seller_name: 'João Silva',
    product_id: 'instagram',
    establishment_name: 'Espaço Beleza & Estética VIP',
    quantity: 1,
    unit_price: 90.0,
    total_price: 90.0,
    commission_amount: 20.0,
    nfc_configured: true,
    qrcode_tested: true,
    sale_date: '2026-10-06T16:45:00Z',
    synced_at: '2026-10-06T16:45:08Z',
    client_request_id: 'req-003',
    status: 'ACTIVE'
  },
  {
    id: 'sale-4',
    seller_id: 'user-seller-2',
    seller_name: 'Mariana Costa',
    product_id: 'instagram',
    establishment_name: 'Barbearia Don Corleone',
    quantity: 3,
    unit_price: 90.0,
    total_price: 270.0,
    commission_amount: 60.0,
    nfc_configured: true,
    qrcode_tested: true,
    sale_date: '2026-10-08T15:20:00Z',
    synced_at: '2026-10-08T15:20:12Z',
    client_request_id: 'req-004',
    status: 'ACTIVE'
  }
];

export const INITIAL_SUPPORT_MATERIALS: SupportMaterial[] = [
  {
    id: 'mat-01',
    code: '01',
    title: 'Comece Aqui — Guia do Parceiro Comercial',
    category: 'Treinamento',
    description: 'Manual de boas-vindas, entendimento do modelo de negócio e mentalidade de venda.',
    readTime: '3 min',
    summary: 'Apresenta as bases do produto NFC CONNECT, o valor das avaliações no Google para o comércio local e como cada placa gera impacto direto no faturamento do estabelecimento.',
    keyPoints: [
      'Entenda por que 93% dos clientes olham avaliações no Google antes de comprar.',
      'Apresente a placa física como solução de autoridade imediata no balcão.',
      'Sua remuneração é de R$ 20 por placa instalada e testada no momento.'
    ]
  },
  {
    id: 'mat-02',
    code: '02',
    title: 'Roteiro de Abordagem Presencial',
    category: 'Vendas',
    description: 'Pitch de 45 segundos para quebrar barreiras com recepcionistas e falar direto com o decisor.',
    readTime: '4 min',
    summary: 'Roteiro passo a passo para chegar ao estabelecimento, contornar o atendente inicial e demonstrar a tecnologia ao dono em menos de 1 minuto.',
    keyPoints: [
      'Frase de abertura: "Olá, sou especialista em posicionamento Google da Comunicar Marketing."',
      'Demonstração sensorial: aproxime seu próprio celular da placa de teste para ele ver a mágica acontecer.',
      'Foco na dor: "Quantos clientes saem daqui satisfeitos todos os dias sem deixar 5 estrelas no seu Google?"'
    ]
  },
  {
    id: 'mat-03',
    code: '03',
    title: 'Como Apresentar o Produto no Balcão',
    category: 'Vendas',
    description: 'Demonstração prática ao vivo com o celular do próprio lojista.',
    readTime: '5 min',
    summary: 'Passo a passo da demonstração prática que fecha a venda: pedir permissão para encostar no celular dele.',
    keyPoints: [
      'Peça o celular do proprietário: "Posso encostar rapidinho no seu celular?"',
      'A tela do Google Meu Negócio / Instagram dele abre instantaneamente.',
      'O fator "Uau": elimine digitação, links compridos e QR Codes feios.'
    ]
  },
  {
    id: 'mat-04',
    code: '04',
    title: 'Objeções & Respostas Prontas',
    category: 'Vendas',
    description: 'Como superar: "Tá caro", "Já tenho QR Code impresso" e "Depois eu vejo".',
    readTime: '6 min',
    summary: 'Guia definitivo para contornar as 5 maiores objeções de lojistas sem entrar em discussão de preço.',
    keyPoints: [
      '"Já tenho QR Code impresso num papel": O papel desbota, amassa e o cliente tem preguiça de abrir câmera. O NFC é um toque premium.',
      '"R$ 90 é caro": Uma única avaliação 5 estrelas atrai clientes novos todo mês. O investimento se paga no primeiro cliente extra.',
      '"Preciso falar com meu sócio": Demonstre agora e deixe a placa configurada: "Se em 7 dias não fizer diferença, eu recolho."'
    ]
  },
  {
    id: 'mat-05',
    code: '05',
    title: 'Configuração Técnica do NFC & QR Code',
    category: 'Técnico',
    description: 'Como pegar o link direto de avaliação do Google e link do Instagram para gravar.',
    readTime: '4 min',
    summary: 'Instruções exatas de como extrair a URL de avaliação direta do perfil da empresa no Google e testar com NFC Tools.',
    keyPoints: [
      'Google: Acesse o perfil do cliente no Google -> "Pedir avaliações" -> copie o link curto oficial.',
      'Instagram: Use o formato https://instagram.com/nomedousuario.',
      'SEMPRE teste a leitura por aproximação e a câmera do QR Code na frente do cliente antes de sair.'
    ]
  },
  {
    id: 'mat-06',
    code: '06',
    title: 'Registro de Venda & Regra de Ouro',
    category: 'Técnico',
    description: 'Como lançar a venda no app para computar sua comissão e debitar o estoque.',
    readTime: '3 min',
    summary: 'Explicação do fluxo atômico do aplicativo: validação de saldo, interruptores de teste e fila offline.',
    keyPoints: [
      'Nunca saia do cliente sem registrar a venda no app.',
      'Se estiver sem sinal de internet no local, o app salva a venda no modo offline e sincroniza sozinho.',
      'Cada venda realizada gera R$ 20 imediatos no seu extrato mensal.'
    ]
  },
  {
    id: 'mat-07',
    code: '07',
    title: 'Vídeo Demonstrativo NFC CONNECT',
    category: 'Apresentação',
    description: 'Vídeo em alta definição mostrando a placa em ação em cafeterias, barbearias e clínicas.',
    readTime: '1 min',
    summary: 'Vídeo dinâmico de 30 segundos pronto para mostrar na tela do celular para clientes indecisos.',
    keyPoints: [
      'Mostra o cliente aproximando o iPhone e o Android da placa no balcão.',
      'Reforça a elegância do acabamento em acrílico resistente.',
      'Excelente ferramenta de fechamento visual.'
    ]
  },
  {
    id: 'mat-08',
    code: '08',
    title: 'Apresentação Comercial em PDF',
    category: 'Apresentação',
    description: 'Material visual completo da Comunicar Marketing para envio no WhatsApp do lojista.',
    readTime: '5 min',
    summary: 'Catálogo executivo de 4 páginas detalhando o poder do Google 5 Estrelas e o crescimento orgânico de seguidores no Instagram.',
    keyPoints: [
      'Ideal para enviar ao decisor após a visita caso ele precise mostrar para a diretoria.',
      'Tabela comparativa: Papel impresso vs Placa Inteligente NFC.',
      'Garantia e suporte direto da Comunicar Marketing.'
    ]
  }
];
