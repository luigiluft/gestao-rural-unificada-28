import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Edit, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface CTeCardProps {
  cte: any
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDownloadXML?: () => void
}

export function CTeCard({ cte, onView, onEdit, onDelete, onDownloadXML }: CTeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'secondary'
      case 'autorizado':
        return 'default'
      case 'cancelado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'autorizado':
        return 'Autorizado'
      case 'cancelado':
        return 'Cancelado'
      case 'denegado':
        return 'Denegado'
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">
            CT-e {cte.numero_cte}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Série: {cte.serie} • Modelo: {cte.modelo}
          </p>
        </div>
        <Badge variant={getStatusColor(cte.status)}>
          {getStatusLabel(cte.status)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Emissão</p>
            <p className="font-medium">{formatDate(cte.data_emissao)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor Total</p>
            <p className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(cte.valor_total_servico)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Remetente</p>
            <p className="font-medium">{cte.remetente_nome}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Destinatário</p>
            <p className="font-medium">{cte.destinatario_nome}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Origem → Destino</p>
            <p className="font-medium">
              {cte.municipio_inicio_nome}/{cte.municipio_inicio_uf} → {cte.municipio_fim_nome}/{cte.municipio_fim_uf}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          )}
          {onEdit && cte.status === 'rascunho' && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDownloadXML && cte.xml_content && (
            <Button variant="outline" size="sm" onClick={onDownloadXML}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onDelete && cte.status === 'rascunho' && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}