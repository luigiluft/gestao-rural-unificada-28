import { useState, useEffect } from "react"
import { 
  Plus, 
  Package,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  Check,
  X,
  GripVertical,
  Save,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { ColumnVisibilityControl, ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormularioSaida } from "@/components/Saidas/FormularioSaida"
import { useSaidas } from "@/hooks/useSaidas"
import { useAprovarSaida } from "@/hooks/useSaidasAprovacao"
import { useProfilesForSaidas } from "@/hooks/useProfilesForSaidas"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"

// Sortable header component
const SortableTableHead = ({ 
  id, 
  children, 
  className = "" 
}: { 
  id: string; 
  children: React.ReactNode; 
  className?: string 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`relative group ${className}`}
      {...attributes}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        <button
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
          aria-label="Arrastar coluna"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>
    </TableHead>
  )
}

const Saidas = () => {
  const { user } = useAuth()
  const { data: userProfile } = useProfile()
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saidaToDelete, setSaidaToDelete] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Column management state
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "id", "origem", "criadoPor", "destinatario", "produtos", 
    "data", "tipo", "status", "aprovacao", "valorTotal", "acoes"
  ])
  
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "id", label: "ID", visible: true, category: "Identificação" },
    { key: "origem", label: "Origem", visible: true, category: "Identificação" },
    { key: "criadoPor", label: "Criado por", visible: true, category: "Identificação" },
    { key: "destinatario", label: "Destinatário", visible: true, category: "Destino" },
    { key: "produtos", label: "Produtos", visible: true, category: "Produtos" },
    { key: "data", label: "Data", visible: true, category: "Data" },
    { key: "tipo", label: "Tipo", visible: true, category: "Classificação" },
    { key: "status", label: "Status", visible: true, category: "Status" },
    { key: "aprovacao", label: "Aprovação", visible: true, category: "Status" },
    { key: "valorTotal", label: "Valor Total", visible: true, category: "Financeiro" },
    { key: "acoes", label: "Ações", visible: true, category: "Ações" },
  ])

  // Data fetching
  const { data: saidas = [], isLoading, refetch } = useSaidas(dateRange)
  const { data: profilesData, isLoading: isLoadingProfiles, error: profilesError } = useProfilesForSaidas(saidas)
  const aprovarSaida = useAprovarSaida()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(25)

  // Calculate pagination
  const totalRecords = saidas.length
  const totalPages = Math.ceil(totalRecords / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords)
  const paginatedSaidas = saidas.slice(startIndex, endIndex)

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [saidas])

  // Save table view
  const saveTableView = () => {
    const settings = {
      columnOrder,
      columns,
      recordsPerPage,
    }
    localStorage.setItem('saidas-table-settings', JSON.stringify(settings))
    toast({
      title: "Visualização salva",
      description: "As configurações da tabela foram salvas com sucesso.",
    })
  }

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load saved view settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('saidas-table-settings')
    if (savedSettings) {
      try {
        const { columnOrder: savedOrder, columns: savedColumns, recordsPerPage: savedRecordsPerPage } = JSON.parse(savedSettings)
        if (savedOrder) setColumnOrder(savedOrder)
        if (savedColumns) setColumns(savedColumns)
        if (savedRecordsPerPage) setRecordsPerPage(savedRecordsPerPage)
      } catch (error) {
        console.error('Error loading table settings:', error)
      }
    }
  }, [])

  // Save view settings
  const saveViewSettings = (newColumnOrder?: string[], newColumns?: ColumnConfig[], newRecordsPerPage?: number) => {
    const settings = {
      columnOrder: newColumnOrder || columnOrder,
      columns: newColumns || columns,
      recordsPerPage: newRecordsPerPage || recordsPerPage,
    }
    localStorage.setItem('saidas-table-settings', JSON.stringify(settings))
  }

  // Handle column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over.id as string)
      
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
      setColumnOrder(newOrder)
      saveViewSettings(newOrder, columns)
    }
  }

  // Handle column visibility
  const handleVisibilityChange = (columnKey: string, visible: boolean) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible } : col
    )
    setColumns(updatedColumns)
    saveViewSettings(columnOrder, updatedColumns)
  }

  // Reset to default view
  const handleResetDefault = () => {
    const defaultOrder = [
      "id", "origem", "criadoPor", "destinatario", "produtos", 
      "data", "tipo", "status", "aprovacao", "valorTotal", "acoes"
    ]
    const defaultColumns = [
      { key: "id", label: "ID", visible: true, category: "Identificação" },
      { key: "origem", label: "Origem", visible: true, category: "Identificação" },
      { key: "criadoPor", label: "Criado por", visible: true, category: "Identificação" },
      { key: "destinatario", label: "Destinatário", visible: true, category: "Destino" },
      { key: "produtos", label: "Produtos", visible: true, category: "Produtos" },
      { key: "data", label: "Data", visible: true, category: "Data" },
      { key: "tipo", label: "Tipo", visible: true, category: "Classificação" },
      { key: "status", label: "Status", visible: true, category: "Status" },
      { key: "aprovacao", label: "Aprovação", visible: true, category: "Status" },
      { key: "valorTotal", label: "Valor Total", visible: true, category: "Financeiro" },
      { key: "acoes", label: "Ações", visible: true, category: "Ações" },
    ]
    
    setColumnOrder(defaultOrder)
    setColumns(defaultColumns)
    saveViewSettings(defaultOrder, defaultColumns)
  }

  // Get visible columns in order
  const visibleColumns = columnOrder
    .map(key => columns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined && col.visible)

  // Column content mapping
  const renderColumnContent = (columnKey: string, saida: any) => {
    switch (columnKey) {
      case "id":
        return (
          <div className="w-full max-w-full">
            <div className="font-medium truncate">
              SAI{saida.id.slice(-3).toUpperCase()}
            </div>
          </div>
        )
      case "origem":
        return (
          <div className="w-full max-w-full">
            {saida.criado_por_franqueado ? (
              <Badge variant="secondary" className="text-xs">
                Franqueado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Própria
              </Badge>
            )}
          </div>
        )
      case "criadoPor":
        return (
          <div className="w-full max-w-full">
            <div className="truncate">
              {saida.criado_por_franqueado ? (
                profilesData?.criadores[saida.user_id]?.nome || "Carregando..."
              ) : (
                "Própria"
              )}
            </div>
          </div>
        )
      case "destinatario":
        return (
          <div className="w-full max-w-full">
            <div className="truncate">
              {profilesData?.destinatarios[saida.produtor_destinatario_id]?.nome || "Carregando..."}
            </div>
          </div>
        )
      case "produtos":
        return (
          <div className="w-full max-w-full">
            <div className="flex flex-col gap-1">
              {saida.saida_itens?.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                    <Package className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm truncate">
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
          </div>
        )
      case "data":
        return (
          <div className="w-full max-w-full">
            <div className="truncate">
              {new Date(saida.data_saida).toLocaleDateString('pt-BR')}
            </div>
          </div>
        )
      case "tipo":
        return (
          <div className="w-full max-w-full">
            <Badge variant="outline" className="truncate">
              {saida.tipo_saida || "Não definido"}
            </Badge>
          </div>
        )
      case "status":
        return (
          <div className="w-full max-w-full">
            <Badge variant={getStatusColor(saida.status || "separacao_pendente") as "default" | "secondary" | "outline" | "destructive"} className="truncate">
              {saida.status === 'separacao_pendente' ? 'Separação Pendente' : 
               saida.status === 'separado' ? 'Separado' :
               saida.status === 'expedido' ? 'Expedido' :
               saida.status === 'entregue' ? 'Entregue' : 
               saida.status || "Separação Pendente"}
            </Badge>
          </div>
        )
      case "aprovacao":
        return (
          <div className="w-full max-w-full">
            <div className="flex items-center gap-2">
              <Badge variant={getApprovalStatusColor(saida.status_aprovacao_produtor || "aprovado") as "default" | "secondary" | "outline" | "destructive"} className="truncate">
                {saida.status_aprovacao_produtor === 'aprovado' ? 'Aprovado' :
                 saida.status_aprovacao_produtor === 'reprovado' ? 'Reprovado' :
                 saida.status_aprovacao_produtor === 'pendente' ? 'Pendente' : 'Aprovado'}
              </Badge>
               {userProfile?.role === 'produtor' && saida.criado_por_franqueado && saida.status_aprovacao_produtor === 'pendente' && (
                 <div className="flex gap-1 ml-2">
                   <Button
                     size="sm"
                     variant="outline"
                     className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                     onClick={() => handleApproval(saida.id, true)}
                     disabled={aprovarSaida.isPending}
                     title="Aprovar saída"
                   >
                     <Check className="w-3 h-3" />
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     className="h-6 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                     onClick={() => handleApproval(saida.id, false)}
                     disabled={aprovarSaida.isPending}
                     title="Reprovar saída"
                   >
                     <X className="w-3 h-3" />
                   </Button>
                 </div>
               )}
            </div>
          </div>
        )
      case "valorTotal":
        return (
          <div className="w-full max-w-full">
            <div className="font-medium truncate">
              {formatCurrency(saida.valor_total)}
            </div>
          </div>
        )
      case "acoes":
        return (
          <div className="w-full max-w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
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
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteClick(saida.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      default:
        return null
    }
  }
  

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
        return "secondary"  // Changed from outline to secondary for better visibility
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

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
      
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <ColumnVisibilityControl
            columns={columns}
            onVisibilityChange={handleVisibilityChange}
            onResetDefault={handleResetDefault}
          />
          
          <Button variant="outline" size="sm" onClick={saveTableView} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Visualização
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Registros por página:</span>
            <Select value={recordsPerPage.toString()} onValueChange={(value) => setRecordsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Saidas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Saídas</CardTitle>
          <CardDescription>
            {saidas?.length || 0} saídas registradas
            {userProfile?.role === 'produtor' && ' (incluindo aprovações pendentes)'}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {visibleColumns.map((column) => (
                          <SortableTableHead
                            key={column.key}
                            id={column.key}
                            className={column.key === "acoes" ? "w-[100px]" : ""}
                          >
                            {column.label}
                          </SortableTableHead>
                        ))}
                      </SortableContext>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSaidas.map((saida) => (
                      <TableRow key={saida.id} className="hover:bg-muted/50">
                        {visibleColumns.map((column) => (
                          <TableCell key={column.key} className="overflow-hidden">
                            {renderColumnContent(column.key, saida)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <div className="flex items-center justify-between p-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{endIndex} de {totalRecords} registros
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1} 
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages} 
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
    </div>
  )
}

export default Saidas