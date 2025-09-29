import { useState } from "react"
import { Search, Package, AlertTriangle, Calendar, Building2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useProdutosAvariados, ProdutoAvariado } from "@/hooks/useProdutosAvariados"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AvariasTab() {
  const { data: avarias, isLoading } = useProdutosAvariados()
  const [selectedAvaria, setSelectedAvaria] = useState<ProdutoAvariado | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter avarias based on search term
  const filteredAvarias = avarias?.filter(avaria => {
    const produto = avaria.entrada_itens?.produtos?.nome || avaria.entrada_itens?.nome_produto || ""
    const lote = avaria.entrada_itens?.lote || ""
    const codigo = avaria.entrada_itens?.produtos?.codigo || avaria.entrada_itens?.codigo_produto || ""
    const franquia = avaria.franquias?.nome || ""
    
    const searchLower = searchTerm.toLowerCase()
    return (
      produto.toLowerCase().includes(searchLower) ||
      lote.toLowerCase().includes(searchLower) ||
      codigo.toLowerCase().includes(searchLower) ||
      franquia.toLowerCase().includes(searchLower)
    )
  }) || []

  const totalQuantidadeAvariada = filteredAvarias.reduce((acc, avaria) => acc + avaria.quantidade, 0)
  const valorTotalAvarias = filteredAvarias.reduce((acc, avaria) => {
    const valorUnitario = avaria.entrada_itens?.valor_unitario || 0
    return acc + (avaria.quantidade * valorUnitario)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Avarias</p>
              <p className="text-2xl font-bold text-destructive">{filteredAvarias.length}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantidade Avariada</p>
              <p className="text-2xl font-bold text-warning">{totalQuantidadeAvariada.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">R$ {valorTotalAvarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por produto, lote, código ou depósito..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredAvarias.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Quantidade Avariada</TableHead>
                <TableHead>Pallet</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Data de Registro</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAvarias.map((avaria, index) => {
                const produto = avaria.entrada_itens?.produtos || { 
                  nome: avaria.entrada_itens?.nome_produto || 'Produto não identificado',
                  codigo: avaria.entrada_itens?.codigo_produto,
                  unidade_medida: 'UN'
                }
                const valorUnitario = avaria.entrada_itens?.valor_unitario || 0
                const valorTotal = avaria.quantidade * valorUnitario
                
                return (
                  <TableRow key={`${avaria.pallet_id}-${avaria.entrada_item_id}-${index}`} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Código: {produto.codigo || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{avaria.entrada_itens?.lote || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-destructive">
                          {avaria.quantidade} {produto.unidade_medida}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Avaria
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        #{avaria.entrada_pallets?.numero_pallet || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{avaria.franquias?.nome || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDistanceToNow(new Date(avaria.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(avaria.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedAvaria(avaria)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Avaria</DialogTitle>
                            <DialogDescription>
                              Informações completas sobre o produto avariado
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedAvaria && (
                            <div className="space-y-4">
                              <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Produto</h4>
                                    <p className="text-muted-foreground">
                                      {selectedAvaria.entrada_itens?.produtos?.nome || selectedAvaria.entrada_itens?.nome_produto}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Lote</h4>
                                    <p className="text-muted-foreground">
                                      {selectedAvaria.entrada_itens?.lote || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Quantidade Avariada</h4>
                                    <p className="text-destructive font-medium">
                                      {selectedAvaria.quantidade} {selectedAvaria.entrada_itens?.produtos?.unidade_medida || 'UN'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Pallet</h4>
                                    <p className="text-muted-foreground font-mono">
                                      #{selectedAvaria.entrada_pallets?.numero_pallet || 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Depósito</h4>
                                    <p className="text-muted-foreground">
                                      {selectedAvaria.franquias?.nome || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Data de Entrada</h4>
                                    <p className="text-muted-foreground">
                                      {selectedAvaria.entrada_pallets?.entradas?.data_entrada 
                                        ? new Date(selectedAvaria.entrada_pallets.entradas.data_entrada).toLocaleDateString('pt-BR')
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Valor Unitário</h4>
                                    <p className="text-muted-foreground">
                                      R$ {(selectedAvaria.entrada_itens?.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Valor Total da Avaria</h4>
                                    <p className="text-destructive font-medium">
                                      R$ {((selectedAvaria.entrada_itens?.valor_unitario || 0) * selectedAvaria.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium">Data de Registro da Avaria</h4>
                                  <p className="text-muted-foreground">
                                    {new Date(selectedAvaria.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState 
          icon={<AlertTriangle className="w-8 h-8 text-muted-foreground" />} 
          title="Nenhuma avaria registrada" 
          description={searchTerm ? "Nenhuma avaria encontrada com os critérios de busca." : "Ainda não há produtos avariados registrados no sistema."} 
        />
      )}
    </div>
  )
}