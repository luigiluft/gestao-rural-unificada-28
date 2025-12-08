import { Badge } from "@/components/ui/badge"
import { Link2, ArrowRight, Building, Truck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FluxoBadgeProps {
  tipoFluxo: 'venda' | 'transferencia' | 'remessa' | 'devolucao'
  status: 'pendente' | 'recebido' | 'confirmado' | 'rejeitado'
  clienteOrigem?: string
  clienteDestino?: string
  compact?: boolean
}

export function FluxoBadge({ tipoFluxo, status, clienteOrigem, clienteDestino, compact = false }: FluxoBadgeProps) {
  const getFluxoConfig = () => {
    switch (tipoFluxo) {
      case 'venda':
        return { label: 'Venda Interna', icon: ArrowRight, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
      case 'transferencia':
        return { label: 'Transferência', icon: Building, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
      case 'remessa':
        return { label: 'Remessa', icon: Truck, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
      case 'devolucao':
        return { label: 'Devolução', icon: ArrowRight, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' }
      default:
        return { label: 'Documento Interno', icon: Link2, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'pendente':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' }
      case 'recebido':
        return { label: 'Recebido', color: 'bg-blue-100 text-blue-800' }
      case 'confirmado':
        return { label: 'Confirmado', color: 'bg-green-100 text-green-800' }
      case 'rejeitado':
        return { label: 'Rejeitado', color: 'bg-red-100 text-red-800' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const fluxoConfig = getFluxoConfig()
  const statusConfig = getStatusConfig()
  const Icon = fluxoConfig.icon

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${fluxoConfig.color} cursor-help`}>
              <Icon className="h-3 w-3 mr-1" />
              EDI
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{fluxoConfig.label}</p>
              {clienteOrigem && <p>De: {clienteOrigem}</p>}
              {clienteDestino && <p>Para: {clienteDestino}</p>}
              <p>Status: {statusConfig.label}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={fluxoConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {fluxoConfig.label}
      </Badge>
      <Badge variant="outline" className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    </div>
  )
}
