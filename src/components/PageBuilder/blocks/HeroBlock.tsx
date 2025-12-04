import { Store } from "lucide-react"

interface HeroBlockConfig {
  titulo?: string
  subtitulo?: string
  mostrarLogo?: boolean
  mostrarBanner?: boolean
}

interface HeroBlockProps {
  config: HeroBlockConfig
  lojaData?: {
    nome_loja: string
    descricao?: string
    logo_url?: string
    banner_url?: string
  }
  isPreview?: boolean
}

export function HeroBlock({ config, lojaData, isPreview }: HeroBlockProps) {
  const titulo = config.titulo || lojaData?.nome_loja || "Nome da Loja"
  const subtitulo = config.subtitulo || lojaData?.descricao || "Descrição da loja"
  const mostrarLogo = config.mostrarLogo !== false
  const mostrarBanner = config.mostrarBanner !== false

  return (
    <div className="relative">
      {mostrarBanner ? (
        <div className={`w-full overflow-hidden ${isPreview ? 'h-32' : 'h-48 md:h-64'}`}>
          {lojaData?.banner_url ? (
            <img
              src={lojaData.banner_url}
              alt={`Banner ${titulo}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10" />
          )}
        </div>
      ) : (
        <div className={`w-full bg-primary/10 ${isPreview ? 'h-20' : 'h-32'}`} />
      )}

      <div className="container mx-auto px-4">
        <div className={`relative flex items-end gap-4 pb-6 ${mostrarBanner ? '-mt-16' : 'pt-6'}`}>
          {mostrarLogo && (
            <div className={`rounded-xl bg-background shadow-lg overflow-hidden border-4 border-background ${isPreview ? 'w-16 h-16' : 'w-32 h-32'}`}>
              {lojaData?.logo_url ? (
                <img
                  src={lojaData.logo_url}
                  alt={titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Store className={isPreview ? 'h-6 w-6' : 'h-12 w-12'} />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 pb-2">
            <h1 className={`font-bold ${isPreview ? 'text-lg' : 'text-2xl md:text-3xl'}`}>{titulo}</h1>
            {subtitulo && (
              <p className={`text-muted-foreground mt-1 line-clamp-2 ${isPreview ? 'text-xs' : ''}`}>
                {subtitulo}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
