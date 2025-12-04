import { BlocoLoja } from './types'
import { HeroBlock, ContatoInfoBlock, ProdutosGridBlock, TabsNavegacaoBlock, FooterBlock } from './blocks'

interface LojaData {
  nome_loja: string
  descricao?: string
  logo_url?: string
  banner_url?: string
  email_contato?: string
  whatsapp?: string
  horario_atendimento?: string
  mostrar_telefone?: boolean
}

interface Anuncio {
  id: string
  titulo: string
  preco_unitario: number
  preco_promocional?: number | null
  quantidade_minima: number
  unidade_venda: string
  categoria?: string | null
  imagens?: string[] | null
  descricao_anuncio?: string | null
}

interface BlockRendererProps {
  bloco: BlocoLoja
  lojaData?: LojaData
  anuncios?: Anuncio[]
  lojaSlug?: string
  isPreview?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function BlockRenderer({ 
  bloco, 
  lojaData, 
  anuncios = [], 
  lojaSlug = "",
  isPreview = false,
  isSelected = false,
  onClick 
}: BlockRendererProps) {
  const wrapperClasses = onClick 
    ? `cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1'}`
    : ''

  const renderBlock = () => {
    switch (bloco.tipo) {
      case 'hero':
        return <HeroBlock config={bloco.config} lojaData={lojaData} isPreview={isPreview} />
      
      case 'contato':
        return <ContatoInfoBlock config={bloco.config} lojaData={lojaData} isPreview={isPreview} />
      
      case 'grade_produtos':
        return <ProdutosGridBlock config={bloco.config} anuncios={anuncios} lojaSlug={lojaSlug} isPreview={isPreview} />
      
      case 'tabs_navegacao':
        return <TabsNavegacaoBlock config={bloco.config} isPreview={isPreview} />
      
      case 'footer':
        return <FooterBlock config={bloco.config} lojaData={lojaData} lojaSlug={lojaSlug} isPreview={isPreview} />
      
      case 'separador':
        return (
          <div className="container mx-auto px-4 py-4">
            <hr className="border-border" />
          </div>
        )
      
      case 'texto':
        return (
          <div className="container mx-auto px-4 py-6">
            <h3 className={`font-bold mb-2 ${isPreview ? 'text-sm' : 'text-xl'}`}>
              {bloco.config.titulo || "Título"}
            </h3>
            <p className={`text-muted-foreground ${isPreview ? 'text-xs' : ''}`}>
              {bloco.config.conteudo || "Conteúdo do texto..."}
            </p>
          </div>
        )
      
      default:
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground">
              Bloco: {bloco.tipo}
            </div>
          </div>
        )
    }
  }

  return (
    <div className={wrapperClasses} onClick={onClick}>
      {renderBlock()}
    </div>
  )
}
