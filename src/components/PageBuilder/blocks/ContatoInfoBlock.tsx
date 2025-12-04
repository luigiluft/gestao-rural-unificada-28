import { Mail, Phone, Clock } from "lucide-react"

interface ContatoInfoBlockConfig {
  mostrarEmail?: boolean
  mostrarTelefone?: boolean
  mostrarHorario?: boolean
}

interface ContatoInfoBlockProps {
  config: ContatoInfoBlockConfig
  lojaData?: {
    email_contato?: string
    whatsapp?: string
    horario_atendimento?: string
    mostrar_telefone?: boolean
  }
  isPreview?: boolean
}

export function ContatoInfoBlock({ config, lojaData, isPreview }: ContatoInfoBlockProps) {
  const mostrarEmail = config.mostrarEmail !== false
  const mostrarTelefone = config.mostrarTelefone !== false
  const mostrarHorario = config.mostrarHorario !== false

  const hasContent = (mostrarEmail && lojaData?.email_contato) || 
                     (mostrarTelefone && lojaData?.whatsapp) || 
                     (mostrarHorario && lojaData?.horario_atendimento)

  if (!hasContent && !isPreview) return null

  return (
    <div className="container mx-auto px-4">
      <div className={`flex flex-wrap gap-4 py-4 text-muted-foreground ${isPreview ? 'text-xs' : 'text-sm'}`}>
        {mostrarEmail && (lojaData?.email_contato || isPreview) && (
          <div className="flex items-center gap-1">
            <Mail className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
            {lojaData?.email_contato || "email@exemplo.com"}
          </div>
        )}
        {mostrarTelefone && (lojaData?.whatsapp || isPreview) && lojaData?.mostrar_telefone !== false && (
          <div className="flex items-center gap-1">
            <Phone className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
            {lojaData?.whatsapp || "(00) 00000-0000"}
          </div>
        )}
        {mostrarHorario && (lojaData?.horario_atendimento || isPreview) && (
          <div className="flex items-center gap-1">
            <Clock className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
            {lojaData?.horario_atendimento || "Seg-Sex 8h-18h"}
          </div>
        )}
      </div>
    </div>
  )
}
