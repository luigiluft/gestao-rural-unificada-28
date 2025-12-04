export type TipoBlocoLoja = 
  | 'hero' 
  | 'grade_produtos' 
  | 'categorias' 
  | 'carrossel' 
  | 'texto' 
  | 'depoimentos' 
  | 'contato' 
  | 'video' 
  | 'separador' 
  | 'redes_sociais'
  | 'tabs_navegacao'
  | 'footer';

export interface BlocoLoja {
  id: string;
  tipo: TipoBlocoLoja;
  ordem: number;
  config: Record<string, any>;
}

export interface PaginaLoja {
  blocos: BlocoLoja[];
}

export interface LayoutPaginas {
  home: PaginaLoja;
  [key: string]: PaginaLoja;
}

export interface PaginaDisponivel {
  id: string;
  nome: string;
  descricao: string;
}

export interface BlocoDefinicao {
  tipo: TipoBlocoLoja;
  nome: string;
  icone: string;
  descricao: string;
  configPadrao: Record<string, any>;
}

export const BLOCOS_DISPONIVEIS: BlocoDefinicao[] = [
  {
    tipo: 'hero',
    nome: 'Banner Principal',
    icone: '🖼️',
    descricao: 'Banner com título, subtítulo e botão',
    configPadrao: {
      titulo: '',
      subtitulo: '',
      mostrarLogo: true,
      mostrarBanner: true
    }
  },
  {
    tipo: 'grade_produtos',
    nome: 'Grade de Produtos',
    icone: '🛍️',
    descricao: 'Exibe produtos em grid',
    configPadrao: {
      colunas: 4,
      limite: 0,
      mostrarBusca: true,
      mostrarCategorias: true
    }
  },
  {
    tipo: 'tabs_navegacao',
    nome: 'Tabs de Navegação',
    icone: '📑',
    descricao: 'Abas para Spot e Cotação',
    configPadrao: {
      mostrarSpot: true,
      mostrarCotacao: true,
      tabAtiva: 'spot'
    }
  },
  {
    tipo: 'categorias',
    nome: 'Categorias',
    icone: '📦',
    descricao: 'Seções de categorias em destaque',
    configPadrao: {
      titulo: 'Categorias',
      categorias: []
    }
  },
  {
    tipo: 'carrossel',
    nome: 'Carrossel',
    icone: '🎠',
    descricao: 'Carrossel de imagens',
    configPadrao: {
      imagens: [],
      autoplay: true,
      intervalo: 5000
    }
  },
  {
    tipo: 'texto',
    nome: 'Texto',
    icone: '📝',
    descricao: 'Bloco de texto rico',
    configPadrao: {
      titulo: '',
      conteudo: '',
      alinhamento: 'left'
    }
  },
  {
    tipo: 'depoimentos',
    nome: 'Depoimentos',
    icone: '💬',
    descricao: 'Seção de reviews/depoimentos',
    configPadrao: {
      titulo: 'O que nossos clientes dizem',
      depoimentos: []
    }
  },
  {
    tipo: 'contato',
    nome: 'Contato',
    icone: '📧',
    descricao: 'Informações de contato',
    configPadrao: {
      mostrarEmail: true,
      mostrarTelefone: true,
      mostrarHorario: true
    }
  },
  {
    tipo: 'video',
    nome: 'Vídeo',
    icone: '🎬',
    descricao: 'Embed de vídeo',
    configPadrao: {
      url: '',
      titulo: ''
    }
  },
  {
    tipo: 'separador',
    nome: 'Separador',
    icone: '➖',
    descricao: 'Linha divisória',
    configPadrao: {
      estilo: 'solid',
      margem: 'md'
    }
  },
  {
    tipo: 'redes_sociais',
    nome: 'Redes Sociais',
    icone: '📱',
    descricao: 'Links para redes sociais',
    configPadrao: {
      instagram: '',
      facebook: '',
      youtube: '',
      linkedin: ''
    }
  },
  {
    tipo: 'footer',
    nome: 'Rodapé',
    icone: '📋',
    descricao: 'Rodapé da loja',
    configPadrao: {
      mostrarInfoLoja: true,
      mostrarContato: true,
      mostrarLinks: true
    }
  }
];

export const PAGINAS_DISPONIVEIS: PaginaDisponivel[] = [
  { id: 'home', nome: 'Página Inicial', descricao: 'Página principal da loja' },
  { id: 'produto', nome: 'Página de Produto', descricao: 'Template para página de produto individual' },
  { id: 'cotacao', nome: 'Cotação', descricao: 'Página de solicitação de cotação' }
];
