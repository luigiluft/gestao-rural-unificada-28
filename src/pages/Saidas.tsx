import { useState } from "react"
import { 
  Plus, 
  Package,
  Eye,
  Edit,
  MoreHorizontal
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
import { useSaidas } from "@/hooks/useSaidas"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"

import { useQueryClient } from "@tanstack/react-query"

export default function Saidas() {
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const queryClient = useQueryClient()
  
  const { data: saidas, isLoading } = useSaidas(dateRange)

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

  const handleSaidaSubmit = () => {
    setIsNewSaidaOpen(false)
    queryClient.invalidateQueries({ queryKey: ["saidas"] })
    queryClient.invalidateQueries({ queryKey: ["estoque"] })
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
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Data</TableHead>
                      
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
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