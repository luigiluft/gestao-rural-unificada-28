import { useState } from "react"
import { 
  Plus, 
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ColumnVisibilityControl, type ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useToast } from "@/hooks/use-toast"
import { useEntradas } from "@/hooks/useEntradas"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"
import { format } from "date-fns"

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const },
    'em_transferencia': { label: 'Em Transferência', variant: 'default' as const },
    'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const },
    'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const },
    'confirmado': { label: 'Confirmado', variant: 'default' as const },
    'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const },
    'processando': { label: 'Processando', variant: 'secondary' as const }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || 
    { label: status || 'Desconhecido', variant: 'secondary' as const }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function Entradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const { toast } = useToast()
  const { data: entradas, isLoading } = useEntradas(dateRange)
  const { isAdmin, isFranqueado } = useUserRole()

  // Column visibility and width state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    // Basic Info
    { key: "numero_nfe", label: "NFe", visible: true, category: "Básico" },
    { key: "serie", label: "Série", visible: true, category: "Básico" },
    { key: "chave_nfe", label: "Chave", visible: false, category: "Básico" },
    { key: "emitente_nome", label: "Emitente", visible: true, category: "Básico" },
    { key: "emitente_cnpj", label: "CNPJ/CPF", visible: false, category: "Básico" },
    { key: "data_emissao", label: "Data", visible: true, category: "Básico" },
    { key: "data_entrada", label: "Entrada", visible: false, category: "Básico" },
    { key: "natureza_operacao", label: "Operação", visible: false, category: "Básico" },
    { key: "itens_count", label: "Itens", visible: true, category: "Básico" },
    { key: "deposito_nome", label: "Depósito", visible: false, category: "Básico" },
    { key: "status_aprovacao", label: "Status", visible: true, category: "Básico" },
    { key: "valor_total", label: "Valor", visible: true, category: "Básico" },
    { key: "actions", label: "Ações", visible: true, category: "Básico" },
    
    // Emitente
    { key: "emitente_nome_fantasia", label: "Nome Fantasia", visible: false, category: "Emitente" },
    { key: "emitente_ie", label: "IE", visible: false, category: "Emitente" },
    { key: "emitente_endereco", label: "Endereço", visible: false, category: "Emitente" },
    { key: "emitente_municipio", label: "Município", visible: false, category: "Emitente" },
    { key: "emitente_uf", label: "UF", visible: false, category: "Emitente" },
    { key: "emitente_cep", label: "CEP", visible: false, category: "Emitente" },
    { key: "emitente_telefone", label: "Telefone", visible: false, category: "Emitente" },
    
    // Destinatário
    { key: "destinatario_nome", label: "Nome", visible: false, category: "Destinatário" },
    { key: "destinatario_cpf_cnpj", label: "CPF/CNPJ", visible: false, category: "Destinatário" },
    { key: "destinatario_ie", label: "IE", visible: false, category: "Destinatário" },
    { key: "destinatario_endereco", label: "Endereço", visible: false, category: "Destinatário" },
    { key: "destinatario_municipio", label: "Município", visible: false, category: "Destinatário" },
    { key: "destinatario_uf", label: "UF", visible: false, category: "Destinatário" },
    { key: "destinatario_cep", label: "CEP", visible: false, category: "Destinatário" },
    
    // Transporte
    { key: "modalidade_frete", label: "Modalidade Frete", visible: false, category: "Transporte" },
    { key: "transportadora_nome", label: "Transportadora", visible: false, category: "Transporte" },
    { key: "transportadora_cnpj", label: "CNPJ Transp.", visible: false, category: "Transporte" },
    { key: "veiculo_placa", label: "Placa", visible: false, category: "Transporte" },
    { key: "veiculo_uf", label: "UF Veículo", visible: false, category: "Transporte" },
    
    // Valores
    { key: "valor_produtos", label: "Valor Produtos", visible: false, category: "Valores" },
    { key: "valor_frete", label: "Valor Frete", visible: false, category: "Valores" },
    { key: "valor_seguro", label: "Valor Seguro", visible: false, category: "Valores" },
    { key: "valor_desconto", label: "Valor Desconto", visible: false, category: "Valores" },
    { key: "valor_icms", label: "ICMS", visible: false, category: "Valores" },
    { key: "valor_ipi", label: "IPI", visible: false, category: "Valores" },
    { key: "valor_pis", label: "PIS", visible: false, category: "Valores" },
    { key: "valor_cofins", label: "COFINS", visible: false, category: "Valores" },
    { key: "valor_total_tributos", label: "Total Tributos", visible: false, category: "Valores" },
    
    // Pesos/Volumes
    { key: "quantidade_volumes", label: "Qtd. Volumes", visible: false, category: "Pesos/Volumes" },
    { key: "peso_bruto", label: "Peso Bruto", visible: false, category: "Pesos/Volumes" },
    { key: "peso_liquido", label: "Peso Líquido", visible: false, category: "Pesos/Volumes" },
    
    // Datas
    { key: "dh_emissao", label: "DH Emissão", visible: false, category: "Datas" },
    { key: "dh_saida_entrada", label: "DH Saída/Entrada", visible: false, category: "Datas" },
    { key: "data_recebimento", label: "Data Recebimento", visible: false, category: "Datas" },
    { key: "data_aprovacao", label: "Data Aprovação", visible: false, category: "Datas" },
    
    // Sistema
    { key: "created_at", label: "Criado em", visible: false, category: "Sistema" },
    { key: "updated_at", label: "Atualizado em", visible: false, category: "Sistema" },
    { key: "observacoes", label: "Observações", visible: false, category: "Sistema" },
    { key: "observacoes_franqueado", label: "Obs. Franqueado", visible: false, category: "Sistema" },
  ])

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    setIsResizing(true)
    setResizingColumn(columnKey)
    
    const startX = e.clientX
    const startWidth = columnWidths[columnKey] || 120
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX))
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }))
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const getCellContent = (entrada: any, column: ColumnConfig) => {
    switch (column.key) {
      case "numero_nfe":
        return entrada.numero_nfe || "N/A"
      case "serie":
        return entrada.serie || "N/A"
      case "chave_nfe":
        return entrada.chave_nfe ? entrada.chave_nfe.substring(0, 8) + "..." : "N/A"
      case "emitente_nome":
        return entrada.emitente_nome || entrada.fornecedores?.nome || "N/A"
      case "emitente_cnpj":
        return entrada.emitente_cnpj || "N/A"
      case "data_emissao":
        return entrada.data_emissao 
          ? format(new Date(entrada.data_emissao), "dd/MM/yyyy") 
          : entrada.data_entrada 
            ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") 
            : "N/A"
      case "data_entrada":
        return entrada.data_entrada 
          ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") 
          : "N/A"
      case "natureza_operacao":
        return entrada.natureza_operacao || "N/A"
      case "itens_count":
        return entrada.entrada_itens?.length || 0
      case "deposito_nome":
        return entrada.franquias?.nome || "N/A"
      case "status_aprovacao":
        return <StatusBadge status={entrada.status_aprovacao || 'aguardando_transporte'} />
      case "valor_total":
        return entrada.valor_total 
          ? `R$ ${Number(entrada.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
          : "N/A"
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEntrada(entrada)
                setIsEditMode(true)
              }}
              className="h-7 w-7 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
            {(isAdmin || isFranqueado) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedEntrada(entrada)
                    setIsEditMode(true)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
                      console.log('Delete entrada:', entrada.id)
                    }
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      // Extended fields - simplified to prevent TypeScript errors
      default:
        const value = entrada[column.key as keyof typeof entrada]
        if (value && typeof value === 'string' && value.includes('T')) {
          // Date formatting for ISO strings
          try {
            return format(new Date(value), "dd/MM/yyyy HH:mm")
          } catch {
            return value
          }
        }
        return value || "N/A"
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Title Section */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Entradas</h1>
              <p className="text-muted-foreground">
                Gerencie e registre as entradas de produtos no estoque
              </p>
            </div>
            
            <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Entrada</DialogTitle>
                  <DialogDescription>
                    Importe uma NFe ou preencha os dados manualmente
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                  <p>Formulário em desenvolvimento...</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex-shrink-0 bg-background">
        <div className="p-6 border-b">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Filtro por Período</h2>
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </div>

      {/* Column Control Section */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 py-4">
          <ColumnVisibilityControl
            columns={columns}
            onVisibilityChange={(columnKey, visible) => {
              setColumns(prev => prev.map(col => 
                col.key === columnKey ? { ...col, visible } : col
              ))
            }}
            onResetDefault={() => {
              setColumns(prev => prev.map(col => ({
                ...col,
                visible: ["numero_nfe", "serie", "emitente_nome", "data_emissao", "itens_count", "status_aprovacao", "valor_total", "actions"].includes(col.key)
              })))
            }}
          />
        </div>
      </div>

      {/* Entradas Table - Fixed width with internal horizontal scroll */}
      <div className="flex-1 p-6 min-h-0">
        <Card className="shadow-card h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Lista de Entradas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entradas && entradas.length > 0 ? (
              <div className="w-full max-w-full overflow-x-auto">
                <Table className="table-fixed w-max min-w-max">
                  <TableHeader className="sticky top-0 bg-background border-b z-10">
                    <TableRow>
                      {columns.filter(col => col.visible).map((column, index) => {
                        const width = columnWidths[column.key] || 120
                        const visibleColumns = columns.filter(col => col.visible)
                        const isLastColumn = index === visibleColumns.length - 1
                        
                        return (
                          <TableHead 
                            key={column.key} 
                            className="text-xs lg:text-sm whitespace-nowrap px-2 relative border-r"
                            style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{column.label}</span>
                              {!isLastColumn && (
                                <div
                                  className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize bg-border/50 hover:bg-primary/30 active:bg-primary/50 transition-colors z-20"
                                  onMouseDown={(e) => handleMouseDown(column.key, e)}
                                  style={{ userSelect: 'none' }}
                                  title="Arraste para redimensionar coluna"
                                />
                              )}
                            </div>
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entradas.map((entrada) => (
                      <TableRow key={entrada.id} className="hover:bg-muted/50">
                        {columns.filter(col => col.visible).map((column) => {
                          const content = getCellContent(entrada, column)
                          const isAction = column.key === "actions" || column.key === "status_aprovacao"
                          const width = columnWidths[column.key] || 120
                          
                          return (
                            <TableCell 
                              key={column.key} 
                              className="text-xs lg:text-sm whitespace-nowrap px-2"
                              style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                            >
                              {isAction ? content : (
                                <span 
                                  className="truncate block" 
                                  title={typeof content === 'string' ? content : ''}
                                >
                                  {content}
                                </span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <EmptyState
                  icon={<Package className="w-8 h-8 text-muted-foreground" />}
                  title="Nenhuma entrada registrada"
                  description="Registre sua primeira entrada importando uma NFe ou preenchendo o formulário manual."
                  action={{
                    label: "Registrar Primeira Entrada",
                    onClick: () => setIsNewEntryOpen(true)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}