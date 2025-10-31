import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFaturas } from "@/hooks/useFaturas"
import { useAuth } from "@/contexts/AuthContext"

export default function Faturas() {
  const { user } = useAuth()
  const [selectedFatura, setSelectedFatura] = useState<any | null>(null)

  const { data: faturas = [], isLoading } = useFaturas()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      rascunho: { label: "Em Andamento", variant: "outline" as const },
      pendente: { label: "Pendente", variant: "secondary" as const },
      pago: { label: "Pago", variant: "default" as const },
      vencido: { label: "Vencido", variant: "destructive" as const },
      cancelado: { label: "Cancelado", variant: "destructive" as const },
      contestado: { label: "Contestado", variant: "destructive" as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Carregando faturas...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie suas faturas
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              faturas.map((fatura) => (
                <TableRow key={fatura.id}>
                  <TableCell className="font-medium">{fatura.numero_fatura}</TableCell>
                  <TableCell>{formatDate(fatura.data_emissao)}</TableCell>
                  <TableCell>{formatDate(fatura.data_vencimento)}</TableCell>
                  <TableCell>{formatCurrency(fatura.valor_total || 0)}</TableCell>
                  <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                  <TableCell>
                    {fatura.periodo_inicio && fatura.periodo_fim 
                      ? `Fatura referente a ${format(new Date(fatura.periodo_inicio), 'MMMM/yyyy', { locale: ptBR })}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFatura(fatura)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // TODO: Implementar download da fatura
                          console.log("Download fatura:", fatura.id)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
