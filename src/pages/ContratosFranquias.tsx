import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useContratosFranquia } from "@/hooks/useContratosFranquia"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileText, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ContratosFranquias() {
  const navigate = useNavigate()
  const { data: contratos, isLoading } = useContratosFranquia()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ativo: "default",
      suspenso: "secondary",
      cancelado: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getTipoRoyaltyLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      percentual_faturamento: "% do Faturamento",
      valor_fixo_mensal: "Valor Fixo Mensal",
      margem_por_servico: "Margem por Serviço",
    }
    return labels[tipo] || tipo
  }

  const getValorRoyalty = (contrato: any) => {
    if (contrato.tipo_royalty === 'percentual_faturamento' && contrato.percentual_faturamento) {
      return `${contrato.percentual_faturamento}%`
    }
    if (contrato.tipo_royalty === 'valor_fixo_mensal' && contrato.valor_fixo_mensal) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(contrato.valor_fixo_mensal))
    }
    if (contrato.tipo_royalty === 'margem_por_servico') {
      return 'Variável'
    }
    return '-'
  }

  const contratosAtivos = contratos?.filter(c => c.status === 'ativo').length || 0
  const contratosSuspensos = contratos?.filter(c => c.status === 'suspenso').length || 0
  const hoje = new Date()
  const contratosPorVencer = contratos?.filter(c => {
    if (!c.data_fim) return false
    const dataFim = new Date(c.data_fim)
    const diffTime = dataFim.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 30
  }).length || 0

  return (
    <TablePageLayout
      title="Contratos com Franquias"
      description="Gerenciar contratos de royalties entre a matriz e as franquias"
      actionButton={
        <Button onClick={() => navigate('/contratos-franquias/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      }
      tableContent={
        <>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total de Contratos</h3>
                <p className="text-2xl font-bold mt-2">{contratos?.length || 0}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Contratos Ativos</h3>
                <p className="text-2xl font-bold mt-2">{contratosAtivos}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Suspensos</h3>
                <p className="text-2xl font-bold mt-2">{contratosSuspensos}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">A Vencer (30 dias)</h3>
                <p className="text-2xl font-bold mt-2">{contratosPorVencer}</p>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Franquia</TableHead>
                  <TableHead>Tipo de Royalty</TableHead>
                  <TableHead>Valor/Percentual</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead>Dia Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : contratos && contratos.length > 0 ? (
                  contratos.map((contrato) => {
                    
                    return (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">{contrato.numero_contrato}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contrato.franquias?.nome}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTipoRoyaltyLabel(contrato.tipo_royalty)}</TableCell>
                        <TableCell>{getValorRoyalty(contrato)}</TableCell>
                        <TableCell>
                          {format(new Date(contrato.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {contrato.data_fim 
                            ? format(new Date(contrato.data_fim), 'dd/MM/yyyy', { locale: ptBR })
                            : 'Indeterminado'}
                        </TableCell>
                        <TableCell>Dia {contrato.dia_vencimento}</TableCell>
                        <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/contratos-franquias/${contrato.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhum contrato cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      }
    />
  )
}
