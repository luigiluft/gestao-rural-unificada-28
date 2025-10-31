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
import { FileText, Download, Eye, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFaturas } from "@/hooks/useFaturas"
import { useFaturaItens } from "@/hooks/useFaturaItens"
import { useAtualizarFatura } from "@/hooks/useAtualizarFatura"
import { useAuth } from "@/contexts/AuthContext"
import { useContratos } from "@/hooks/useContratos"
import { useInicializarFatura } from "@/hooks/useInicializarFatura"
import { LoadingState } from "@/components/ui/loading-state"

export default function Faturas() {
  const { user } = useAuth()
  const [selectedFatura, setSelectedFatura] = useState<any | null>(null)

  const { isInitializing } = useInicializarFatura(user?.id)
  const { data: faturas = [], isLoading } = useFaturas({ incluir_rascunho: true })
  const { data: contratos = [] } = useContratos()
  const atualizarFatura = useAtualizarFatura()

  // Fatura em rascunho (ativa)
  const faturaAtiva = faturas.find(f => f.status === 'rascunho')
  const { data: itensAtivos = [] } = useFaturaItens(faturaAtiva?.id)
  
  // Faturas fechadas (histórico)
  const faturasHistorico = faturas.filter(f => f.status !== 'rascunho')

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

  const handleAtualizarFatura = () => {
    if (faturaAtiva) {
      const contrato = contratos.find(c => c.id === faturaAtiva.contrato_id)
      if (contrato) {
        atualizarFatura.mutate(contrato.id)
      }
    }
  }

  if (isLoading || isInitializing) {
    return (
      <div className="container mx-auto py-8">
        <LoadingState 
          variant="spinner" 
          text="Gerando fatura atualizada..." 
          fullHeight 
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seus consumos e faturas em tempo real
          </p>
        </div>
      </div>

      {/* Fatura Atual em Andamento */}
      {faturaAtiva && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Fatura Atual</h2>
                <Badge variant="outline" className="bg-background">Em Andamento</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Período: {faturaAtiva.periodo_inicio && format(new Date(faturaAtiva.periodo_inicio), 'dd/MM/yyyy', { locale: ptBR })} até {faturaAtiva.periodo_fim && format(new Date(faturaAtiva.periodo_fim), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Acumulado</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(faturaAtiva.valor_total || 0)}</p>
            </div>
          </div>

          {itensAtivos.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Detalhamento dos Serviços</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAtualizarFatura}
                  disabled={atualizarFatura.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${atualizarFatura.isPending ? 'animate-spin' : ''}`} />
                  Atualizar Valores
                </Button>
              </div>
              <div className="space-y-2">
                {itensAtivos.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{item.descricao_servico}</p>
                      <p className="text-sm text-muted-foreground">
                        Utilizado: {item.quantidade_utilizada} | Faturado: {item.quantidade_faturada} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.valor_total || 0)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.valor_unitario || 0)}/un</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Histórico de Faturas */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Histórico de Faturas</h2>
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
            {faturasHistorico.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              faturasHistorico.map((fatura) => (
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
