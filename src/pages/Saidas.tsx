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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FormularioSaida } from "@/components/Saidas/FormularioSaida"
import { AprovacaoSaidas } from "@/components/Saidas/AprovacaoSaidas"
import { useSaidas } from "@/hooks/useSaidas"
import { useAprovarSaida } from "@/hooks/useSaidasAprovacao"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"

const Saidas = () => {
  const { user } = useAuth()
  const { data: userProfile } = useProfile()
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saidaToDelete, setSaidaToDelete] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { data: saidas, isLoading, refetch } = useSaidas(dateRange)
  const aprovarSaida = useAprovarSaida()

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
        return "outline"
      default:
        return "outline"
    }
  }

  const handleApproval = async (saidaId: string, aprovado: boolean) => {
    try {
      await aprovarSaida.mutateAsync({
        saidaId,
        aprovado,
        observacoes: aprovado ? "Aprovado via tabela principal" : "Reprovado via tabela principal"
      })
      refetch()
    } catch (error) {
      console.error("Erro ao processar aprovação:", error)
    }
  }

  const handleSaidaSubmit = () => {
    setIsNewSaidaOpen(false)
    queryClient.invalidateQueries({ queryKey: ["saidas"] })
    queryClient.invalidateQueries({ queryKey: ["estoque"] })
  }

  const handleDeleteClick = (saidaId: string) => {
    setSaidaToDelete(saidaId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSaida = async () => {
    if (!saidaToDelete) return

    try {
      console.log('=== INICIANDO DELEÇÃO DA SAÍDA ===', saidaToDelete)
      
      const { data: saidaExists, error: checkError } = await supabase
        .from('saidas')
        .select('id, user_id')
        .eq('id', saidaToDelete)
        .single()
      
      if (checkError) {
        console.error('Erro ao verificar saída:', checkError)
        throw new Error(`Saída não encontrada: ${checkError.message}`)
      }
      
      console.log('Saída encontrada:', saidaExists)

      // 1. Deletar saida_status_historico primeiro (se existir)
      console.log('STEP 1: Deletando saida_status_historico para:', saidaToDelete)
      const { data: deletedHistorico, error: historicoDeleteError } = await supabase
        .from('saida_status_historico')
        .delete()
        .eq('saida_id', saidaToDelete)
        .select()

      console.log('Histórico deletado:', deletedHistorico?.length || 0, 'registros')
      if (historicoDeleteError) {
        console.error('Erro ao deletar histórico:', historicoDeleteError)
        // Não falhar se não conseguir deletar histórico
      }

      // 2. Buscar saida_itens
      console.log('STEP 2: Buscando saida_itens para:', saidaToDelete)
      const { data: saidaItens, error: fetchItensError } = await supabase
        .from('saida_itens')
        .select('id, produto_id, quantidade')
        .eq('saida_id', saidaToDelete)

      if (fetchItensError) {
        console.error('Erro ao buscar itens:', fetchItensError)
        throw new Error(`Erro ao buscar itens: ${fetchItensError.message}`)
      }

      console.log('Saída itens encontrados:', saidaItens?.length || 0)

      // 3. Restaurar estoque (devolver as quantidades) - se necessário
      if (saidaItens && saidaItens.length > 0) {
        console.log('STEP 3: Restaurando estoque para itens deletados')
        
        for (const item of saidaItens) {
          if (item.produto_id && item.quantidade) {
            console.log(`Item processado: ${item.quantidade} unidades do produto ${item.produto_id}`)
            // Não é mais necessário atualizar o estoque manualmente
            // O estoque será atualizado automaticamente quando as movimentações forem deletadas
          }
        }
      }

      // 4. Deletar movimentações relacionadas
      console.log('STEP 4: Deletando movimentações para:', saidaToDelete)
      const { data: deletedMovimentacoes, error: movimentacoesError } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('referencia_id', saidaToDelete)
        .eq('referencia_tipo', 'saida')
        .select()

      console.log('Movimentações deletadas:', deletedMovimentacoes?.length || 0, 'registros')
      if (movimentacoesError) {
        console.error('Erro ao deletar movimentações:', movimentacoesError)
        // Não falhar crítico
      }

      // 5. Deletar saida_itens
      console.log('STEP 5: Deletando saida_itens para:', saidaToDelete)
      const { data: deletedItens, error: itensDeleteError } = await supabase
        .from('saida_itens')
        .delete()
        .eq('saida_id', saidaToDelete)
        .select()

      console.log('Saída itens deletados:', deletedItens?.length || 0, 'registros')
      if (itensDeleteError) {
        console.error('Erro ao deletar itens:', itensDeleteError)
        throw new Error(`Erro ao deletar itens: ${itensDeleteError.message}`)
      }

      // 6. FINALMENTE, deletar a saída
      console.log('STEP 6: Deletando saída principal:', saidaToDelete)
      const { data: deletedSaida, error: saidaDeleteError } = await supabase
        .from('saidas')
        .delete()
        .eq('id', saidaToDelete)
        .select()

      console.log('Saída principal deletada:', deletedSaida?.length || 0, 'registros')
      if (saidaDeleteError) {
        console.error('ERRO CRÍTICO ao deletar saída:', saidaDeleteError)
        throw new Error(`ERRO ao deletar saída: ${saidaDeleteError.message}`)
      }

      if (!deletedSaida || deletedSaida.length === 0) {
        console.error('NENHUMA SAÍDA FOI DELETADA - RLS bloqueou a operação')
        throw new Error('Nenhuma saída foi deletada. As políticas de segurança impediram a operação.')
      }

      console.log('=== DELEÇÃO DA SAÍDA CONCLUÍDA COM SUCESSO ===')

      toast({
        title: "Saída deletada",
        description: `A saída SAI${saidaToDelete.slice(-3).toUpperCase()} e todos os dados relacionados foram removidos com sucesso.`,
      })

      // Recarregar dados
      refetch()
      queryClient.invalidateQueries({ queryKey: ["estoque"] })
      
    } catch (error: any) {
      console.error('=== ERRO NA DELEÇÃO DA SAÍDA ===', error)
      toast({
        title: "Erro ao deletar saída",
        description: error.message || "Ocorreu um erro ao deletar a saída e seus dados relacionados.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSaidaToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
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
              <Button className="bg-gradient-primary hover:bg-primary/90">
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
      
      {/* Conditional rendering based on user role */}
      {userProfile?.role === 'produtor' ? (
        <Tabs defaultValue="saidas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saidas">Minhas Saídas</TabsTrigger>
            <TabsTrigger value="aprovacoes">Aprovações Pendentes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saidas" className="space-y-4">
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
                  {saidas?.length || 0} saídas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !saidas || saidas.length === 0 ? (
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
                      <Table className="min-w-[900px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
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
                                <Badge variant={getApprovalStatusColor(saida.status_aprovacao_produtor || "aprovado") as "default" | "secondary" | "outline" | "destructive"}>
                                  {saida.status_aprovacao_produtor === 'aprovado' ? 'Aprovado' :
                                   saida.status_aprovacao_produtor === 'reprovado' ? 'Reprovado' :
                                   saida.status_aprovacao_produtor === 'pendente' ? 'Pendente' : 'Aprovado'}
                                </Badge>
                                {userProfile?.role === 'produtor' && saida.criado_por_franqueado && saida.status_aprovacao_produtor === 'pendente' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                      onClick={() => handleApproval(saida.id, true)}
                                      disabled={aprovarSaida.isPending}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                      onClick={() => handleApproval(saida.id, false)}
                                      disabled={aprovarSaida.isPending}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              R$ {(saida.valor_total || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(saida.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Deletar
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar a saída SAI{saidaToDelete?.slice(-3).toUpperCase()}?
                    <br /><br />
                    Esta ação é irreversível e irá remover:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>A saída e todos os seus itens</li>
                      <li>Movimentações de estoque relacionadas</li>
                      <li>Histórico de status (se houver)</li>
                      <li>As quantidades serão restauradas ao estoque</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSaida} className="bg-destructive hover:bg-destructive/90">
                    Deletar Saída
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          
          <TabsContent value="aprovacoes" className="space-y-4">
            <AprovacaoSaidas />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Lista de Saídas</CardTitle>
              <CardDescription>
                {saidas?.length || 0} saídas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !saidas || saidas.length === 0 ? (
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
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
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
                            <Badge variant={getApprovalStatusColor(saida.status_aprovacao_produtor || "aprovado") as "default" | "secondary" | "outline" | "destructive"}>
                              {saida.status_aprovacao_produtor === 'aprovado' ? 'Aprovado' :
                               saida.status_aprovacao_produtor === 'reprovado' ? 'Reprovado' :
                               saida.status_aprovacao_produtor === 'pendente' ? 'Pendente' : 'Aprovado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            R$ {(saida.valor_total || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(saida.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Deletar
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

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar a saída SAI{saidaToDelete?.slice(-3).toUpperCase()}?
                  <br /><br />
                  Esta ação é irreversível e irá remover:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>A saída e todos os seus itens</li>
                    <li>Movimentações de estoque relacionadas</li>
                    <li>Histórico de status (se houver)</li>
                    <li>As quantidades serão restauradas ao estoque</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSaida} className="bg-destructive hover:bg-destructive/90">
                  Deletar Saída
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

export default Saidas
