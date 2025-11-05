import { useState, useEffect } from "react";
import { Plus, Eye, Edit, MoreHorizontal, Trash2, Package, Save, ChevronLeft, ChevronRight, GripVertical, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ColumnVisibilityControl, type ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/Entradas/FileUpload";
import { FormularioEntrada } from "@/components/Entradas/FormularioEntrada";
import { useToast } from "@/hooks/use-toast";
import { useEntradas } from "@/hooks/useEntradas";
import { useProducerEntradas } from "@/hooks/useProducerEntradas";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { format } from "date-fns";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { exportToCSV } from "@/utils/csvExport";
import { supabase } from "@/integrations/supabase/client";

const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  const statusConfig = {
    'aguardando_transporte': {
      label: 'Aguardando Transporte',
      variant: 'secondary' as const
    },
    'em_transferencia': {
      label: 'Em Transferência',
      variant: 'default' as const
    },
    'aguardando_conferencia': {
      label: 'Aguardando Conferência',
      variant: 'outline' as const
    },
    'conferencia_completa': {
      label: 'Conferência Completa',
      variant: 'default' as const
    },
    'confirmado': {
      label: 'Confirmado',
      variant: 'default' as const
    },
    'rejeitado': {
      label: 'Rejeitado',
      variant: 'destructive' as const
    },
    'processando': {
      label: 'Processando',
      variant: 'secondary' as const
    }
  };
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Desconhecido',
    variant: 'secondary' as const
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Sortable Table Header Component
function SortableTableHeader({
  column,
  width,
  isLastColumn,
  onMouseDown
}: {
  column: ColumnConfig;
  width: number;
  isLastColumn: boolean;
  onMouseDown: (columnKey: string, e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.key
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1
  };
  return <TableHead ref={setNodeRef} style={{
    ...style,
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`
  }} className={`text-xs lg:text-sm whitespace-nowrap px-2 relative border-r ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded" title="Arrastar para reordenar coluna">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="truncate flex-1">{column.label}</span>
        </div>
        {!isLastColumn && <div className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize bg-border/50 hover:bg-primary/30 active:bg-primary/50 transition-colors z-20" onMouseDown={e => onMouseDown(column.key, e)} style={{
        userSelect: 'none'
      }} title="Arraste para redimensionar coluna" />}
      </div>
    </TableHead>;
}

export default function Entradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [nfData, setNfData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    isAdmin,
    isFranqueado,
    isProdutor
  } = useUserRole();
  
  // Use different hooks based on user role
  const adminFranqueadoQuery = useEntradas(dateRange);
  const produtorQuery = useProducerEntradas(dateRange);
  
  const {
    data: entradas,
    isLoading,
    refetch
  } = isProdutor ? produtorQuery : adminFranqueadoQuery;
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  // Helper function to check if producer can delete entrada
  const canProducerDeleteEntrada = (entrada: any) => {
    if (!isProdutor || !profile?.cpf_cnpj) return false;
    
    const userCpfCnpjLimpo = profile.cpf_cnpj.replace(/\D/g, '');
    const emitenteCnpjLimpo = entrada.emitente_cnpj?.replace(/\D/g, '') || '';
    const destinatarioCpfCnpjLimpo = entrada.destinatario_cpf_cnpj?.replace(/\D/g, '') || '';
    
    // Producer can delete if their CPF/CNPJ matches emitente or destinatario
    return emitenteCnpjLimpo === userCpfCnpjLimpo || destinatarioCpfCnpjLimpo === userCpfCnpjLimpo;
  };

  // Pagination logic
  const totalRecords = entradas?.length || 0;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
  const paginatedEntradas = entradas?.slice(startIndex, endIndex) || [];

  // Column visibility and width state with localStorage persistence
  const [columns, setColumns] = useState<ColumnConfig[]>([
  // Basic Info
  {
    key: "numero_nfe",
    label: "NFe",
    visible: true,
    category: "Básico"
  }, {
    key: "serie",
    label: "Série",
    visible: true,
    category: "Básico"
  }, {
    key: "chave_nfe",
    label: "Chave",
    visible: false,
    category: "Básico"
  }, {
    key: "emitente_nome",
    label: "Emitente",
    visible: true,
    category: "Básico"
  }, {
    key: "emitente_cnpj",
    label: "CNPJ/CPF",
    visible: false,
    category: "Básico"
  }, {
    key: "data_emissao",
    label: "Data",
    visible: true,
    category: "Básico"
  }, {
    key: "data_entrada",
    label: "Entrada",
    visible: false,
    category: "Básico"
  }, {
    key: "natureza_operacao",
    label: "Operação",
    visible: false,
    category: "Básico"
  }, {
    key: "itens_count",
    label: "Itens",
    visible: true,
    category: "Básico"
  }, {
    key: "deposito_nome",
    label: "Depósito",
    visible: false,
    category: "Básico"
  }, {
    key: "status_aprovacao",
    label: "Status",
    visible: true,
    category: "Básico"
  }, {
    key: "valor_total",
    label: "Valor",
    visible: true,
    category: "Básico"
  }, {
    key: "actions",
    label: "Ações",
    visible: true,
    category: "Básico"
  },
  // Emitente
  {
    key: "emitente_nome_fantasia",
    label: "Nome Fantasia",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_ie",
    label: "IE",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_endereco",
    label: "Endereço",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_municipio",
    label: "Município",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_uf",
    label: "UF",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_cep",
    label: "CEP",
    visible: false,
    category: "Emitente"
  }, {
    key: "emitente_telefone",
    label: "Telefone",
    visible: false,
    category: "Emitente"
  },
  // Destinatário
  {
    key: "destinatario_nome",
    label: "Nome",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_cpf_cnpj",
    label: "CPF/CNPJ",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_ie",
    label: "IE",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_endereco",
    label: "Endereço",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_municipio",
    label: "Município",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_uf",
    label: "UF",
    visible: false,
    category: "Destinatário"
  }, {
    key: "destinatario_cep",
    label: "CEP",
    visible: false,
    category: "Destinatário"
  },
  // Transporte
  {
    key: "modalidade_frete",
    label: "Modalidade Frete",
    visible: false,
    category: "Transporte"
  }, {
    key: "transportadora_nome",
    label: "Transportadora",
    visible: false,
    category: "Transporte"
  }, {
    key: "transportadora_cnpj",
    label: "CNPJ Transp.",
    visible: false,
    category: "Transporte"
  }, {
    key: "veiculo_placa",
    label: "Placa",
    visible: false,
    category: "Transporte"
  }, {
    key: "veiculo_uf",
    label: "UF Veículo",
    visible: false,
    category: "Transporte"
  },
  // Valores
  {
    key: "valor_produtos",
    label: "Valor Produtos",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_frete",
    label: "Valor Frete",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_seguro",
    label: "Valor Seguro",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_desconto",
    label: "Valor Desconto",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_icms",
    label: "ICMS",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_ipi",
    label: "IPI",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_pis",
    label: "PIS",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_cofins",
    label: "COFINS",
    visible: false,
    category: "Valores"
  }, {
    key: "valor_total_tributos",
    label: "Total Tributos",
    visible: false,
    category: "Valores"
  },
  // Pesos/Volumes
  {
    key: "quantidade_volumes",
    label: "Qtd. Volumes",
    visible: false,
    category: "Pesos/Volumes"
  }, {
    key: "peso_bruto",
    label: "Peso Bruto",
    visible: false,
    category: "Pesos/Volumes"
  }, {
    key: "peso_liquido",
    label: "Peso Líquido",
    visible: false,
    category: "Pesos/Volumes"
  },
  // Datas
  {
    key: "dh_emissao",
    label: "DH Emissão",
    visible: false,
    category: "Datas"
  }, {
    key: "dh_saida_entrada",
    label: "DH Saída/Entrada",
    visible: false,
    category: "Datas"
  }, {
    key: "data_recebimento",
    label: "Data Recebimento",
    visible: false,
    category: "Datas"
  }, {
    key: "data_aprovacao",
    label: "Data Aprovação",
    visible: false,
    category: "Datas"
  },
  // Sistema
  {
    key: "created_at",
    label: "Criado em",
    visible: false,
    category: "Sistema"
  }, {
    key: "updated_at",
    label: "Atualizado em",
    visible: false,
    category: "Sistema"
  }, {
    key: "observacoes",
    label: "Observações",
    visible: false,
    category: "Sistema"
  }, {
    key: "observacoes_franqueado",
    label: "Obs. Franqueado",
    visible: false,
    category: "Sistema"
  }]);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // Load saved table view on component mount
  useEffect(() => {
    const savedView = localStorage.getItem('entradas-table-view');
    if (savedView) {
      try {
        const {
          columns: savedColumns,
          columnWidths: savedWidths,
          recordsPerPage: savedRecordsPerPage,
          columnOrder
        } = JSON.parse(savedView);
        if (savedColumns) {
          // If we have a saved column order, apply it
          if (columnOrder && Array.isArray(columnOrder)) {
            const orderedColumns = columnOrder.map((key: string) => savedColumns.find((col: ColumnConfig) => col.key === key)).filter(Boolean);

            // Add any new columns that weren't in the saved order
            const newColumns = savedColumns.filter((col: ColumnConfig) => !columnOrder.includes(col.key));
            setColumns([...orderedColumns, ...newColumns]);
          } else {
            setColumns(savedColumns);
          }
        }
        if (savedWidths) setColumnWidths(savedWidths);
        if (savedRecordsPerPage) setRecordsPerPage(savedRecordsPerPage);
      } catch (error) {
        console.error('Error loading saved table view:', error);
      }
    }
  }, []);

  // Save table view function
  const saveTableView = () => {
    const viewConfig = {
      columns,
      columnWidths,
      recordsPerPage,
      columnOrder: columns.map(col => col.key)
    };
    localStorage.setItem('entradas-table-view', JSON.stringify(viewConfig));
    toast({
      title: "Visualização salva",
      description: "As configurações da tabela foram salvas com sucesso."
    });
  };

  // Export to CSV function
  const handleExportCSV = () => {
    try {
      if (!entradas || entradas.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há entradas para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Custom formatters for specific columns
      const customFormatters = {
        status_aprovacao: (value: any) => {
          const statusMap: Record<string, string> = {
            'aguardando_transporte': 'Aguardando Transporte',
            'em_transferencia': 'Em Transferência',
            'aguardando_conferencia': 'Aguardando Conferência',
            'conferencia_completa': 'Conferência Completa',
            'confirmado': 'Confirmado',
            'rejeitado': 'Rejeitado',
            'processando': 'Processando'
          };
          return statusMap[value] || value || 'Desconhecido';
        },
        valor_total: (value: any) => {
          if (!value) return 'R$ 0,00';
          return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        },
        itens_count: (entrada: any) => {
          return String(entrada.entrada_itens?.length || 0);
        },
        emitente_nome: (entrada: any) => {
          return entrada.emitente_nome || entrada.fornecedores?.nome || 'N/A';
        },
        deposito_nome: (entrada: any) => {
          return entrada.franquias?.nome || 'N/A';
        },
        actions: () => '' // Remove actions column from export
      };

      const filename = `entradas-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      
      exportToCSV({
        data: entradas,
        columns: columns.filter(col => col.key !== 'actions'), // Exclude actions from export
        filename,
        customFormatters
      });

      toast({
        title: "Exportação concluída",
        description: `${entradas.length} entradas exportadas para ${filename}.csv`
      });
    } catch (error) {
      console.error('Erro na exportação CSV:', error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao exportar dados.",
        variant: "destructive"
      });
    }
  };

  // Handle column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      setColumns(items => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over!.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Reset to first page when records per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [recordsPerPage]);

  // Handle form submissions
  const handleFileUpload = (uploadedNfData: any) => {
    setNfData(uploadedNfData);
    setActiveTab("manual"); // Switch to manual tab after file upload
    toast({
      title: "NFe importada com sucesso",
      description: "Revise os dados e complete o cadastro."
    });
  };

  const handleFormSubmit = async (dados: any) => {
    try {
      console.log('Dados da entrada:', dados);
      
      // Call the manage-entradas edge function
      const { data, error } = await supabase.functions.invoke('manage-entradas', {
        body: {
          action: 'create',
          data: dados
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Entrada registrada",
        description: "A entrada foi registrada com sucesso."
      });
      
      setIsNewEntryOpen(false);
      setNfData(null);
      setActiveTab("upload");
      refetch(); // Refresh the entries list
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar entrada.",
        variant: "destructive"
      });
    }
  };

  const handleFormCancel = () => {
    setIsNewEntryOpen(false);
    setNfData(null);
    setActiveTab("upload");
  };

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    setIsResizing(true);
    setResizingColumn(columnKey);
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || 120;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getCellContent = (entrada: any, column: ColumnConfig) => {
    switch (column.key) {
      case "numero_nfe":
        return entrada.numero_nfe || "N/A";
      case "serie":
        return entrada.serie || "N/A";
      case "chave_nfe":
        return entrada.chave_nfe ? entrada.chave_nfe.substring(0, 8) + "..." : "N/A";
      case "emitente_nome":
        return entrada.emitente_nome || entrada.fornecedores?.nome || "N/A";
      case "emitente_cnpj":
        return entrada.emitente_cnpj || "N/A";
      case "data_emissao":
        return entrada.data_emissao ? format(new Date(entrada.data_emissao), "dd/MM/yyyy") : entrada.data_entrada ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") : "N/A";
      case "data_entrada":
        return entrada.data_entrada ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") : "N/A";
      case "natureza_operacao":
        return entrada.natureza_operacao || "N/A";
      case "itens_count":
        return entrada.entrada_itens?.length || 0;
      case "deposito_nome":
        return entrada.franquias?.nome || "N/A";
      case "status_aprovacao":
        return <StatusBadge status={entrada.status_aprovacao || 'aguardando_transporte'} />;
      case "valor_total":
        return entrada.valor_total ? `R$ ${Number(entrada.valor_total).toLocaleString('pt-BR', {
          minimumFractionDigits: 2
        })}` : "N/A";
      case "actions":
        return <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => {
            setSelectedEntrada(entrada);
            setIsEditMode(true);
          }} className="h-7 w-7 p-0">
              <Eye className="h-3 w-3" />
            </Button>
            {/* Ações disponíveis baseadas no papel do usuário */}
            {(isAdmin || isFranqueado) && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                setSelectedEntrada(entrada);
                setIsEditMode(true);
              }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {/* Apenas admin pode excluir pela interface administrativa */}
                  {isAdmin && <DropdownMenuItem onClick={async () => {
                const entradaId = entrada.id;
                const entradaNumero = entrada.numero_nfe;
                
                if (confirm(`Tem certeza que deseja excluir a entrada NFe ${entradaNumero}? (Ação administrativa)`)) {
                  try {
                    const { data, error } = await supabase.functions.invoke('manage-entradas', {
                      body: {
                        action: 'delete',
                        data: { id: entradaId }
                      }
                    });

                    if (error) throw error;
                    
                    if (!data?.success) {
                      throw new Error(data?.error || 'Erro ao excluir entrada');
                    }

                    toast({
                      title: "Entrada excluída",
                      description: `A entrada NFe ${entradaNumero} foi excluída com sucesso (Admin).`
                    });

                    queryClient.invalidateQueries({ queryKey: ["entradas"] });
                    queryClient.invalidateQueries({ queryKey: ["warehouse-map"] });
                    queryClient.invalidateQueries({ queryKey: ["pallet-positions"] });
                    queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
                  } catch (error) {
                    console.error('Erro ao excluir entrada:', error);
                    toast({
                      title: "Erro ao excluir",
                      description: error instanceof Error ? error.message : "Erro ao excluir entrada.",
                      variant: "destructive"
                    });
                  }
                }
              }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir (Admin)
                  </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>}
            
            {/* Botão de excluir para produtores (quando são destinatários) */}
            {canProducerDeleteEntrada(entrada) && <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={async () => {
                const entradaId = entrada.id;
                const entradaNumero = entrada.numero_nfe;
                
                if (confirm(`Tem certeza que deseja excluir a entrada NFe ${entradaNumero}?`)) {
                  try {
                    // Atualização otimista: remove imediatamente do cache
                    queryClient.setQueryData(["entradas", dateRange], (old: any) => {
                      if (!old) return old;
                      return old.filter((e: any) => e.id !== entradaId);
                    });

                    const { data, error } = await supabase.functions.invoke('manage-entradas', {
                      body: {
                        action: 'delete',
                        data: { id: entradaId }
                      }
                    });

                    if (error) throw error;
                    
                    if (!data?.success) {
                      throw new Error(data?.error || 'Erro ao excluir entrada');
                    }

                    toast({
                      title: "Entrada excluída",
                      description: `A entrada NFe ${entradaNumero} foi excluída com sucesso.`
                    });

                    // Invalida todas as queries relacionadas
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ["entradas"] }),
                      queryClient.invalidateQueries({ queryKey: ["producer-entradas"] }),
                      queryClient.invalidateQueries({ queryKey: ["warehouse-map"] }),
                      queryClient.invalidateQueries({ queryKey: ["pallet-positions"] }),
                      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
                    ]);
                  } catch (error) {
                    console.error('Erro ao excluir entrada:', error);
                    // Em caso de erro, reverte a atualização otimista
                    await queryClient.invalidateQueries({ queryKey: ["entradas"] });
                    toast({
                      title: "Erro ao excluir",
                      description: error instanceof Error ? error.message : "Erro ao excluir entrada.",
                      variant: "destructive"
                    });
                  }
                }
              }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>}
          </div>;
      // Extended fields - simplified to prevent TypeScript errors
      default:
        const value = entrada[column.key as keyof typeof entrada];
        if (value && typeof value === 'string' && value.includes('T')) {
          // Date formatting for ISO strings
          try {
            return format(new Date(value), "dd/MM/yyyy HH:mm");
          } catch {
            return value;
          }
        }
        return value || "N/A";
    }
  };

  return <div className="min-h-screen flex flex-col overflow-x-hidden">
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
                <Button className="gap-2" size="sm">
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Importar NFe</TabsTrigger>
                    <TabsTrigger value="manual">Preenchimento Manual</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <FileUpload
                      onNFDataParsed={handleFileUpload}
                      onError={(message) => toast({
                        title: "Erro",
                        description: message,
                        variant: "destructive"
                      })}
                    />
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <FormularioEntrada
                      nfData={nfData}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex-shrink-0 bg-background">
        <div className="p-6 border-b">
          <div className="flex flex-col gap-4">
            
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
        </div>
      </div>

      {/* Column Control Section */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <ColumnVisibilityControl columns={columns} onVisibilityChange={(columnKey, visible) => {
              setColumns(prev => prev.map(col => col.key === columnKey ? {
                ...col,
                visible
              } : col));
            }} onResetDefault={() => {
              setColumns(prev => prev.map(col => ({
                ...col,
                visible: ["numero_nfe", "serie", "emitente_nome", "data_emissao", "itens_count", "status_aprovacao", "valor_total", "actions"].includes(col.key)
              })));
            }} />
              <Button variant="outline" size="sm" onClick={saveTableView} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Visualização
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Registros por página:</span>
              <Select value={recordsPerPage.toString()} onValueChange={value => setRecordsPerPage(Number(value))}>
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
      </div>

      {/* Entradas Table - Fixed width with internal horizontal scroll */}
      <div className="flex-1 p-6 min-h-0">
        <Card className="shadow-card h-full flex flex-col">
          
          <CardContent className="flex-1 min-h-0 p-0">
            {isLoading ? <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div> : entradas && entradas.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="w-full max-w-full overflow-x-auto">
                  <Table className="table-fixed w-max min-w-max">
                    <TableHeader className="sticky top-0 bg-background border-b z-10">
                      <TableRow>
                        <SortableContext items={columns.filter(col => col.visible).map(col => col.key)} strategy={horizontalListSortingStrategy}>
                          {columns.filter(col => col.visible).map((column, index) => {
                        const width = columnWidths[column.key] || 120;
                        const visibleColumns = columns.filter(col => col.visible);
                        const isLastColumn = index === visibleColumns.length - 1;
                        return <SortableTableHeader key={column.key} column={column} width={width} isLastColumn={isLastColumn} onMouseDown={handleMouseDown} />;
                      })}
                        </SortableContext>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEntradas.map(entrada => <TableRow key={entrada.id} className="hover:bg-muted/50">
                          {columns.filter(col => col.visible).map(column => {
                      const content = getCellContent(entrada, column);
                      const isAction = column.key === "actions" || column.key === "status_aprovacao";
                      const width = columnWidths[column.key] || 120;
                      return <TableCell key={column.key} className="text-xs lg:text-sm whitespace-nowrap px-2 overflow-hidden" style={{
                        width: `${width}px`,
                        minWidth: `${width}px`,
                        maxWidth: `${width}px`
                      }}>
                                {isAction ? content : <div className="truncate w-full max-w-full" title={typeof content === "string" ? content : ""}>
                                    {content}
                                  </div>}
                              </TableCell>;
                    })}
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </DndContext> : <div className="flex items-center justify-center h-full p-6">
                <EmptyState icon={<Package className="w-8 h-8 text-muted-foreground" />} title="Nenhuma entrada registrada" description="Registre sua primeira entrada importando uma NFe ou preenchendo o formulário manual." action={{
              label: "Registrar Primeira Entrada",
              onClick: () => setIsNewEntryOpen(true)
            }} />
              </div>}
          </CardContent>
          
          {/* Pagination Controls */}
          {totalRecords > 0 && <div className="flex items-center justify-between p-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{endIndex} de {totalRecords} registros
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="gap-1">
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>}
        </Card>
      </div>
    </div>;
}