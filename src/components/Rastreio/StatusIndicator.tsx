import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: string
  type: "entrada" | "saida" | "estoque"
  className?: string
}

export const StatusIndicator = ({ status, type, className }: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    if (type === "entrada") {
      switch (status) {
        case "aguardando_transporte":
          return { label: "Aguardando Transporte", variant: "outline" as const }
        case "em_transferencia":
          return { label: "Em Trânsito", variant: "default" as const }
        case "planejamento":
          return { label: "Planejamento", variant: "secondary" as const }
        default:
          return { label: status, variant: "outline" as const }
      }
    }

    if (type === "saida") {
      switch (status) {
        case "separacao_pendente":
          return { label: "Separação Pendente", variant: "outline" as const }
        case "separado":
          return { label: "Separado", variant: "default" as const }
        case "expedido":
          return { label: "Expedido", variant: "secondary" as const }
        case "entregue":
          return { label: "Entregue", variant: "secondary" as const }
        default:
          return { label: status, variant: "outline" as const }
      }
    }

    return { label: "Armazenado", variant: "secondary" as const }
  }

  const { label, variant } = getStatusConfig()

  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {label}
    </Badge>
  )
}