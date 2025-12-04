import { Link } from "react-router-dom"
import { Store, Mail, Phone, Clock } from "lucide-react"

interface FooterBlockConfig {
  mostrarInfoLoja?: boolean
  mostrarContato?: boolean
  mostrarLinks?: boolean
}

interface FooterBlockProps {
  config: FooterBlockConfig
  lojaData?: {
    nome_loja: string
    descricao?: string
    logo_url?: string
    email_contato?: string
    whatsapp?: string
    horario_atendimento?: string
  }
  lojaSlug?: string
  isPreview?: boolean
}

export function FooterBlock({ config, lojaData, lojaSlug, isPreview }: FooterBlockProps) {
  const mostrarInfoLoja = config.mostrarInfoLoja !== false
  const mostrarContato = config.mostrarContato !== false
  const mostrarLinks = config.mostrarLinks !== false

  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className={`grid grid-cols-1 gap-6 ${isPreview ? '' : 'md:grid-cols-3 gap-8 py-8'}`}>
          {/* Store Info */}
          {mostrarInfoLoja && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {lojaData?.logo_url ? (
                  <img src={lojaData.logo_url} alt={lojaData?.nome_loja || "Loja"} className={`rounded-lg object-cover ${isPreview ? 'h-6 w-6' : 'h-10 w-10'}`} />
                ) : (
                  <Store className={isPreview ? 'h-6 w-6' : 'h-10 w-10'} />
                )}
                <h3 className={`font-bold ${isPreview ? 'text-sm' : 'text-lg'}`}>{lojaData?.nome_loja || "Nome da Loja"}</h3>
              </div>
              {lojaData?.descricao && (
                <p className={`text-muted-foreground ${isPreview ? 'text-xs line-clamp-2' : 'text-sm'}`}>{lojaData.descricao}</p>
              )}
            </div>
          )}

          {/* Contact */}
          {mostrarContato && (
            <div className="space-y-3">
              <h4 className={`font-semibold ${isPreview ? 'text-sm' : ''}`}>Contato</h4>
              <div className={`space-y-1 text-muted-foreground ${isPreview ? 'text-xs' : 'text-sm space-y-2'}`}>
                {(lojaData?.email_contato || isPreview) && (
                  <div className="flex items-center gap-2">
                    <Mail className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
                    <span>{lojaData?.email_contato || "email@exemplo.com"}</span>
                  </div>
                )}
                {(lojaData?.whatsapp || isPreview) && (
                  <div className="flex items-center gap-2">
                    <Phone className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
                    <span>{lojaData?.whatsapp || "(00) 00000-0000"}</span>
                  </div>
                )}
                {(lojaData?.horario_atendimento || isPreview) && (
                  <div className="flex items-center gap-2">
                    <Clock className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
                    <span>{lojaData?.horario_atendimento || "Seg-Sex 8h-18h"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {mostrarLinks && !isPreview && (
            <div className="space-y-3">
              <h4 className="font-semibold">Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/marketplace" className="block text-muted-foreground hover:text-primary">
                  Marketplace AgroHub
                </Link>
                <Link to={`/loja/${lojaSlug}/auth`} className="block text-muted-foreground hover:text-primary">
                  Criar uma conta
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className={`border-t text-center text-muted-foreground ${isPreview ? 'mt-4 pt-3 text-xs' : 'mt-8 pt-6 text-sm'}`}>
          <p>© {new Date().getFullYear()} {lojaData?.nome_loja || "Loja"}. Powered by AgroHub.</p>
        </div>
      </div>
    </footer>
  )
}
