import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { ItemGenerico, FormularioTipo } from "../types/formulario.types"
import { useProductLatestPrice } from "@/hooks/useProductLatestPrice"
import { useEffect } from "react"

interface ItensComunsProps {
  tipo: FormularioTipo
  itens: ItemGenerico[]
  novoItem: ItemGenerico
  onNovoItemChange: (campo: keyof ItemGenerico, valor: any) => void
  onAdicionarItem: () => void
  onRemoverItem: (index: number) => void
  calcularValorTotal: () => number
  // Props específicas por tipo
  estoque?: any[]
  produtosFallback?: any[]
  estoqueFEFO?: any[]
  isTutorialActive?: boolean
  depositoId?: string
}

export function ItensComunsSection({ 
  tipo, 
  itens, 
  novoItem, 
  onNovoItemChange, 
  onAdicionarItem, 
  onRemoverItem, 
  calcularValorTotal,
  estoque = [],
  produtosFallback = [],
  estoqueFEFO = [],
  isTutorialActive,
  depositoId
}: ItensComunsProps) {
  // Debug inicial
  console.log('=== RENDER ItensComunsSection ===')
  console.log('tipo:', tipo)
  console.log('novoItem no render:', novoItem)
  console.log('depositoId:', depositoId)
  
  // Buscar preço mais recente quando produto estiver selecionado
  const { data: latestPrice, isLoading: loadingPrice } = useProductLatestPrice(
    novoItem.produto_id, 
    depositoId
  )

  useEffect(() => {
    console.log('=== EFFECT novoItem.produto_id mudou ===')
    console.log('novoItem.produto_id:', novoItem.produto_id)
    console.log('novoItem completo:', novoItem)
  }, [novoItem.produto_id])

  // Aplicar preço automático quando disponível
  useEffect(() => {
    if (tipo === 'saida' && latestPrice && novoItem.produto_id && !novoItem.valorUnitario) {
      console.log('Aplicando preço automático:', latestPrice, 'para produto:', novoItem.produto_id)
      onNovoItemChange('valorUnitario', latestPrice)
    }
  }, [latestPrice, novoItem.produto_id, tipo, onNovoItemChange, novoItem.valorUnitario])

  // Função para calcular quantidade já usada no carrinho por produto
  const calcularQuantidadeUsadaNoCarrinho = (produtoId: string) => {
    return itens
      .filter(item => item.produto_id === produtoId)
      .reduce((total, item) => total + (item.quantidade || 0), 0)
  }

  // Processar produtos disponíveis baseado no tipo
  const produtosDisponiveis = (() => {
    if (tipo === 'saida') {
      // Para saída, usar estoque
      if (estoque && estoque.length > 0) {
        const agrupados = estoque.reduce((acc, item) => {
          const produtoId = item.produto_id
          const produtoNome = item.produtos?.nome || `Produto ${item.id}`
          
          if (!acc[produtoId]) {
            acc[produtoId] = {
              id: produtoId,
              nome: produtoNome,
              unidade_medida: item.produtos?.unidade_medida || '',
              quantidade_total: 0,
              itens: []
            }
          }
          
          acc[produtoId].quantidade_total += item.quantidade_atual || 0
          acc[produtoId].itens.push(item)
          
          return acc
        }, {} as Record<string, any>)
        
        // Calcular quantidade disponível descontando o que já está no carrinho
        const produtosComQuantidadeAtualizada = Object.values(agrupados).map((produto: any) => {
          const quantidadeUsadaNoCarrinho = calcularQuantidadeUsadaNoCarrinho(produto.id)
          const quantidadeDisponivel = Math.max(0, produto.quantidade_total - quantidadeUsadaNoCarrinho)
          
          return {
            ...produto,
            quantidade_total: quantidadeDisponivel,
            quantidade_original: produto.quantidade_total,
            quantidade_carrinho: quantidadeUsadaNoCarrinho
          }
        }).filter((produto: any) => produto.quantidade_total > 0) // Ocultar produtos sem estoque disponível
        
        console.log('Produtos disponíveis para saída (atualizado):', produtosComQuantidadeAtualizada)
        return produtosComQuantidadeAtualizada
      }
      
      // Fallback para produtos sem estoque
      console.log('Usando produtos fallback para saída:', produtosFallback)
      return produtosFallback.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        unidade_medida: produto.unidade_medida || 'UN'
      }))
    } else {
      // Para entrada, usar produtos fallback ou permitir entrada manual
      console.log('Produtos disponíveis para entrada:', produtosFallback)
      return produtosFallback
    }
  })()

  const handleProdutoChange = (valor: string) => {
    console.log('=== INÍCIO handleProdutoChange ===')
    console.log('Valor recebido:', valor)
    console.log('produtosDisponiveis:', produtosDisponiveis)
    console.log('novoItem.produto_id antes:', novoItem.produto_id)
    
    const produto = produtosDisponiveis.find(p => p.id === valor)
    console.log('Produto encontrado:', produto)
    
    // Mapear unidades para formato padrão
    const unidadeMap: Record<string, string> = {
      'KG': 'kg', 'KGS': 'kg', 'QUILOGRAMA': 'kg', 'QUILOGRAMAS': 'kg',
      'L': 'litros', 'LT': 'litros', 'LITRO': 'litros', 'LITROS': 'litros',
      'UN': 'unidades', 'UND': 'unidades', 'UNIDADE': 'unidades', 'UNIDADES': 'unidades',
      'SC': 'sacas', 'SACAS': 'sacas', 'SACO': 'sacas', 'SACOS': 'sacas'
    }
    const unidadeNormalizada = unidadeMap[(produto?.unidade_medida || '').toUpperCase()] || 'unidades'
    console.log('Unidade normalizada:', unidadeNormalizada)
    
    // Aplicar mudanças sequencialmente
    console.log('Aplicando produto_id:', valor)
    onNovoItemChange('produto_id', valor)
    
    if (produto?.nome) {
      console.log('Aplicando produtoNome:', produto.nome)
      onNovoItemChange('produtoNome', produto.nome)
    }
    
    if (unidadeNormalizada) {
      console.log('Aplicando unidade:', unidadeNormalizada)
      onNovoItemChange('unidade', unidadeNormalizada)
    }

    // Limpar campos dependentes
    console.log('Limpando lote e lote_id')
    onNovoItemChange('lote', '')
    onNovoItemChange('lote_id', '')
    
    // Para entradas, limpar valor unitário para permitir inserção manual
    if (tipo === 'entrada') {
      console.log('Limpando valorUnitario para entrada')
      onNovoItemChange('valorUnitario', '')
    }
    
    console.log('=== FIM handleProdutoChange ===')
  }

  const handleLoteChange = (loteId: string) => {
    if (tipo === 'saida') {
      const loteItem = estoqueFEFO?.find(lote => lote.id === loteId)
      if (loteItem) {
        onNovoItemChange('lote', loteItem.lote || "")
        onNovoItemChange('lote_id', loteId)
      }
    } else {
      onNovoItemChange('lote', loteId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Itens da {tipo === 'entrada' ? 'Entrada' : 'Saída'}
          {isTutorialActive && tipo === 'entrada' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Produtos de Exemplo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar Novo Item */}
        <div className="border rounded-lg p-4 bg-muted/30">
          {/* Layout melhorado para manter todos os campos na mesma linha */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 items-end">
              {/* Produto - 3 colunas */}
              <div className="col-span-12 md:col-span-3 space-y-1">
                <Label className="text-xs font-medium">Produto</Label>
                {tipo === 'saida' ? (
                  <Select 
                    value={novoItem.produto_id || ''} 
                    onValueChange={handleProdutoChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {produtosDisponiveis.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          <div className="flex justify-between items-center w-full">
                            <span className="truncate max-w-[200px]" title={produto.nome}>{produto.nome}</span>
                            {tipo === 'saida' && produto.quantidade_total && (
                              <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                                Disp: {produto.quantidade_total} {produto.unidade_medida || 'UN'}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Nome do produto"
                    value={novoItem.produto}
                    onChange={(e) => onNovoItemChange('produto', e.target.value)}
                    className="w-full"
                  />
                )}
              </div>

              {/* Lote - 2 colunas (apenas para entrada) */}
              {tipo === 'entrada' && (
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <Label className="text-xs font-medium">Lote</Label>
                  <Input
                    placeholder="Lote"
                    value={novoItem.lote}
                    onChange={(e) => handleLoteChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Quantidade - 1 coluna */}
              <div className={`col-span-12 md:col-span-1 space-y-1 ${tipo === 'saida' ? 'md:col-span-2' : ''}`}>
                <Label className="text-xs font-medium">Qtd</Label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={novoItem.quantidade || ''}
                  onChange={(e) => onNovoItemChange('quantidade', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* Unidade - 1 coluna */}
              <div className={`col-span-12 md:col-span-1 space-y-1 ${tipo === 'saida' ? 'md:col-span-2' : ''}`}>
                <Label className="text-xs font-medium">Unidade</Label>
                {tipo === 'saida' ? (
                  <Input
                    value={novoItem.unidade || ''}
                    disabled
                    className="bg-muted w-full"
                  />
                ) : (
                  <Select value={novoItem.unidade} onValueChange={(value) => onNovoItemChange('unidade', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Un" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sacas">Sacas</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="litros">Litros</SelectItem>
                      <SelectItem value="unidades">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Depósito - 2 colunas (apenas para entrada) */}
              {tipo === 'entrada' && (
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <Label className="text-xs font-medium">Depósito</Label>
                  <Select value={novoItem.deposito || ''} onValueChange={(value) => onNovoItemChange('deposito', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Armazém A">Armazém A</SelectItem>
                      <SelectItem value="Armazém B">Armazém B</SelectItem>
                      <SelectItem value="Depósito Campo">Depósito Campo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Valor Unit. - 2 colunas (apenas para entrada) */}
              {tipo === 'entrada' && (
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <Label className="text-xs font-medium">Valor Unit.</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    value={novoItem.valorUnitario || ''}
                    onChange={(e) => onNovoItemChange('valorUnitario', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Ação - 1 coluna */}
              <div className={`col-span-12 md:col-span-1 space-y-1 ${tipo === 'saida' ? 'md:col-span-5' : ''}`}>
                <Label className="text-xs font-medium">Ação</Label>
                <Button 
                  onClick={onAdicionarItem} 
                  size="sm" 
                  className="w-full h-10"
                  data-tutorial="adicionar-item-btn"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Itens */}
        {itens.length > 0 && (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                {tipo === 'entrada' && <TableHead>Lote</TableHead>}
                <TableHead>Quantidade</TableHead>
                {tipo === 'entrada' && <TableHead>Depósito</TableHead>}
                {tipo === 'entrada' && <TableHead>Valor Unit.</TableHead>}
                {tipo === 'entrada' && <TableHead>Valor Total</TableHead>}
                <TableHead className="w-[50px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span className="truncate max-w-[200px] block" title={item.produto || item.produtoNome}>
                      {item.produto || item.produtoNome}
                    </span>
                  </TableCell>
                  {tipo === 'entrada' && <TableCell>{item.lote}</TableCell>}
                  <TableCell>{item.quantidade} {item.unidade}</TableCell>
                  {tipo === 'entrada' && <TableCell>{item.deposito}</TableCell>}
                  {tipo === 'entrada' && <TableCell>R$ {(item.valorUnitario || 0).toFixed(2)}</TableCell>}
                  {tipo === 'entrada' && <TableCell>R$ {(item.valorTotal || 0).toFixed(2)}</TableCell>}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoverItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {itens.length > 0 && tipo === 'entrada' && (
          <div className="flex justify-end">
            <div className="text-lg font-semibold">
              Total: R$ {calcularValorTotal().toFixed(2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}