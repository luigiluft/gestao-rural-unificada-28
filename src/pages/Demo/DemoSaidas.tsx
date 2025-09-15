import { useState } from "react"
import { 
  Plus, 
  Package,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormularioSaida } from "@/components/Saidas/FormularioSaida"
import { EmptyState } from "@/components/ui/empty-state"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"
import { useToast } from "@/hooks/use-toast"
import { mockData } from "@/data/mockData"
import { useTutorial } from "@/contexts/TutorialContext"

const DemoSaidas = () => {
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const { toast } = useToast()
  const { isActive, nextStep, simulateProducerAction } = useTutorial()
  
  const saidas = mockData.saidas
  const profilesData = mockData.profilesData

  const getStatusColor = (status: string) => {
    switch (status) {
      case "entregue":
        return "default"
      case "expedido":
      case "separado":
        return "secondary"
      case "separacao_pendente":
        return "outline"
      default:
        return "outline"
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "default"
      case "reprovado":
        return "destructive"
      case "pendente":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleApproval = async (saidaId: string, aprovado: boolean) => {
    toast({
      title: aprovado ? "Saída aprovada" : "Saída reprovada",
      description: `A saída SAI${saidaId.slice(-3).toUpperCase()} foi ${aprovado ? 'aprovada' : 'reprovada'} com sucesso.`,
    })
    
    // Se estamos no tutorial e aprovamos a saída, continuar o fluxo
    if (isActive && aprovado) {
      setTimeout(() => {
        simulateProducerAction()
      }, 1000)
    }
  }

  const handleSaidaSubmit = () => {
    setIsNewSaidaOpen(false)
    toast({
      title: "Saída registrada",
      description: "A saída foi registrada com sucesso no sistema de demonstração.",
    })
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Indicator */}
      {isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-amber-700 font-medium">MODO DEMONSTRAÇÃO</span>
            <span className="text-amber-600 text-sm">- Dados fictícios para tutorial</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saídas</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe as saídas de produtos do estoque
            </p>
          </div>
          
          <Dialog open={isNewSaidaOpen} onOpenChange={setIsNewSaidaOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90" id="nova-saida-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Registrar Nova Saída</DialogTitle>
                <DialogDescription>
                  Preencha os dados da saída de produtos do estoque
                </DialogDescription>
              </DialogHeader>
              <FormularioSaida
                onSubmit={handleSaidaSubmit}
                onCancel={() => setIsNewSaidaOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Saidas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Saídas</CardTitle>
          <CardDescription>
            {saidas.length} saídas registradas (incluindo aprovações pendentes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {saidas.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8 text-muted-foreground" />}
              title="Nenhuma saída encontrada"
              description="Não há saídas registradas no sistema."
              action={{
                label: "Registrar Primeira Saída",
                onClick: () => setIsNewSaidaOpen(true)
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saidas.map((saida) => (
                    <TableRow key={saida.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        SAI{saida.id.slice(-3).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {saida.criado_por_franqueado ? (
                          <Badge variant="secondary" className="text-xs">
                            Franqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Própria
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {saida.criado_por_franqueado ? (
                          profilesData?.criadores[saida.user_id]?.nome || "Franqueado Demo"
                        ) : (
                          "Própria"
                        )}
                      </TableCell>
                      <TableCell>
                        {profilesData?.destinatarios[saida.produtor_destinatario_id]?.nome || "Você (Produtor Demo)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {saida.saida_itens?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                                <Package className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm">
                                {item.produtos?.nome || "Nome não disponível"} ({item.quantidade || 0} {item.produtos?.unidade_medida || "un"})
                              </span>
                            </div>
                          ))}
                          {(saida.saida_itens?.length || 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{(saida.saida_itens?.length || 0) - 2} mais
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(saida.data_saida).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{saida.tipo_saida || "Não definido"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(saida.status || "separacao_pendente") as "default" | "secondary" | "outline" | "destructive"}>
                          {saida.status === 'separacao_pendente' ? 'Separação Pendente' : 
                           saida.status === 'separado' ? 'Separado' :
                           saida.status === 'expedido' ? 'Expedido' :
                           saida.status === 'entregue' ? 'Entregue' : 
                           saida.status || "Separação Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getApprovalStatusColor(saida.status_aprovacao_produtor || "aprovado") as "default" | "secondary" | "outline" | "destructive"} id="status-aprovacao">
                            {saida.status_aprovacao_produtor === 'aprovado' ? 'Aprovado' :
                             saida.status_aprovacao_produtor === 'reprovado' ? 'Reprovado' :
                             saida.status_aprovacao_produtor === 'pendente' ? 'Pendente' : 'Aprovado'}
                          </Badge>
                           {saida.criado_por_franqueado && saida.status_aprovacao_produtor === 'pendente' && (
                             <div className="flex gap-1 ml-2" id="aprovacao-buttons">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                 onClick={() => handleApproval(saida.id, true)}
                                 title="Aprovar saída"
                                 id="aprovar-btn"
                               >
                                 <Check className="w-3 h-3" />
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="h-6 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                 onClick={() => handleApproval(saida.id, false)}
                                 title="Reprovar saída"
                                 id="reprovar-btn"
                               >
                                 <X className="w-3 h-3" />
                               </Button>
                             </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(saida.valor_total)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DemoSaidas