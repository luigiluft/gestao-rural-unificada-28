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
  | 'redes_sociais';

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
      titulo: 'Bem-vindo à nossa loja',
      subtitulo: 'Produtos de qualidade para você',
      textoBotao: 'Ver Produtos',
      imagemFundo: null,
      corFundo: '#22c55e'
    }
  },
  {
    tipo: 'grade_produtos',
    nome: 'Grade de Produtos',
    icone: '🛍️',
    descricao: 'Exibe produtos em grid',
    configPadrao: {
      titulo: 'Nossos Produtos',
      quantidade: 8,
      categoria: null,
      mostrarPreco: true
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
      mostrarWhatsapp: true,
      mostrarEmail: true,
      mostrarEndereco: false
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
      estilo: 'linha',
      margem: 'normal'
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
  }
];
