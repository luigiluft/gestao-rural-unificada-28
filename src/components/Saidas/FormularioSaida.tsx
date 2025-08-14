import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { useEstoque } from "@/hooks/useEstoque"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile, useProdutores } from "@/hooks/useProfile"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface FormularioSaidaProps {
  onSubmit: (dados: any) => void
  onCancel: () => void
}

interface ItemSaida {
  produto_id: string
  produtoNome: string
  lote?: string
  quantidade: number
  unidade: string
  valor_unitario?: number
  valor_total?: number
}

export function FormularioSaida({ onSubmit, onCancel }: FormularioSaidaProps) {
  const { user } = useAuth()
  const { data: estoque } = useEstoque()
  const { data: profile } = useProfile()
  const { data: produtores } = useProdutores()

  const [dadosSaida, setDadosSaida] = useState({
    data_saida: new Date().toISOString().split('T')[0],
    tipo_saida: "",
    destinatario: "",
    observacoes: "",
    deposito_id: "",
    produtor_destinatario: ""
  })

  const [itens, setItens] = useState<ItemSaida[]>([])
  const [novoItem, setNovoItem] = useState<ItemSaida>({
    produto_id: "",
    produtoNome: "",
    lote: "",
    quantidade: 0,
    unidade: "",
    valor_unitario: 0,
    valor_total: 0
  })

  // Filtrar estoque disponível (quantidade > 0)
  const estoqueDisponivel = estoque?.filter(item => 
    (item.quantidade_atual || 0) > 0
  ) || []

  // Detectar tipo de usuário
  const isProdutor = profile?.role === 'produtor'
  const isFranqueado = profile?.role === 'franqueado'

  const handleProdutoChange = (produtoId: string) => {
    const produto = estoqueDisponivel.find(item => item.id === produtoId)
    if (produto) {
      setNovoItem({
        ...novoItem,
        produto_id: produtoId,
        produtoNome: produto.produtos?.nome || "",
        unidade: produto.produtos?.unidade_medida || "",
        lote: produto.lote || "",
        valor_unitario: produto.valor_medio || 0
      })
    }
  }

  const handleQuantidadeChange = (quantidade: number) => {
    const valorTotal = quantidade * (novoItem.valor_unitario || 0)
    setNovoItem({
      ...novoItem,
      quantidade,
      valor_total: valorTotal
    })
  }

  const adicionarItem = () => {
    if (!novoItem.produto_id || novoItem.quantidade <= 0) {
      toast.error("Selecione um produto e informe uma quantidade válida")
      return
    }

    // Verificar se já existe item com mesmo produto e lote
    const itemExistente = itens.find(item => 
      item.produto_id === novoItem.produto_id && item.lote === novoItem.lote
    )

    if (itemExistente) {
      toast.error("Item já adicionado. Edite a quantidade se necessário.")
      return
    }

    // Verificar disponibilidade no estoque
    const itemEstoque = estoqueDisponivel.find(item => item.id === novoItem.produto_id)
    if (!itemEstoque || (itemEstoque.quantidade_atual || 0) < novoItem.quantidade) {
      toast.error("Quantidade indisponível no estoque")
      return
    }

    setItens([...itens, { ...novoItem }])
    setNovoItem({
      produto_id: "",
      produtoNome: "",
      lote: "",
      quantidade: 0,
      unidade: "",
      valor_unitario: 0,
      valor_total: 0
    })
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const calcularValorTotal = () => {
    return itens.reduce((total, item) => total + (item.valor_total || 0), 0)
  }

  const handleSubmit = async () => {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à saída")
      return
    }

    if (!dadosSaida.tipo_saida) {
      toast.error("Selecione o tipo de saída")
      return
    }

    try {
      // Criar a saída
      const { data: saida, error: saidaError } = await supabase
        .from("saidas")
        .insert({
          user_id: user?.id,
          data_saida: dadosSaida.data_saida,
          tipo_saida: dadosSaida.tipo_saida,
          destinatario: dadosSaida.destinatario,
          observacoes: dadosSaida.observacoes,
          deposito_id: dadosSaida.deposito_id || null,
          valor_total: calcularValorTotal(),
          status: 'preparando'
        })
        .select()
        .single()

      if (saidaError) throw saidaError

      // Criar os itens da saída
      const itensComSaidaId = itens.map(item => ({
        user_id: user?.id,
        saida_id: saida.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        lote: item.lote,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total
      }))

      const { error: itensError } = await supabase
        .from("saida_itens")
        .insert(itensComSaidaId)

      if (itensError) throw itensError

      toast.success("Saída registrada com sucesso!")
      onSubmit(saida)
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
      toast.error("Erro ao registrar saída")
    }
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Produtos - PRIMEIRO */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Saída</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione os produtos que serão enviados
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de novo item */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Produto</Label>
                <Select value={novoItem.produto_id} onValueChange={handleProdutoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {estoqueDisponivel.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.produtos?.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            Disponível: {item.quantidade_atual} {item.produtos?.unidade_medida}
                            {item.lote && ` - Lote: ${item.lote}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={novoItem.quantidade || ''}
                  onChange={(e) => handleQuantidadeChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Input value={novoItem.unidade} disabled />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor Unit.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={novoItem.valor_unitario || ''}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0
                    setNovoItem({
                      ...novoItem,
                      valor_unitario: valor,
                      valor_total: valor * novoItem.quantidade
                    })
                  }}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ação</Label>
                <Button onClick={adicionarItem} size="sm" className="w-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de itens adicionados */}
          {itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="w-[50px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.produtoNome}</TableCell>
                    <TableCell>{item.lote || "-"}</TableCell>
                    <TableCell>{item.quantidade} {item.unidade}</TableCell>
                    <TableCell>R$ {(item.valor_unitario || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {(item.valor_total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {itens.length > 0 && (
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                Total: R$ {calcularValorTotal().toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados da Saída - SEGUNDO, só aparece se tem itens */}
      {itens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da Saída</CardTitle>
            <p className="text-sm text-muted-foreground">
              Preencha os dados da saída dos produtos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_saida">Data da Saída</Label>
                <Input
                  id="data_saida"
                  type="date"
                  value={dadosSaida.data_saida}
                  onChange={(e) => setDadosSaida(prev => ({ ...prev, data_saida: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_saida">Tipo de Saída</Label>
                <Select value={dadosSaida.tipo_saida} onValueChange={(value) => setDadosSaida(prev => ({ ...prev, tipo_saida: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {isProdutor ? (
                      // Para produtores: apenas entrega
                      <>
                        <SelectItem value="entrega_propriedade">Entrega na Propriedade</SelectItem>
                        <SelectItem value="retirada_deposito">Retirada no Depósito</SelectItem>
                      </>
                    ) : (
                      // Para franqueados: opções tradicionais
                      <>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="uso_interno">Uso Interno</SelectItem>
                        <SelectItem value="perda">Perda/Descarte</SelectItem>
                        <SelectItem value="doacao">Doação</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatario">
                  {isFranqueado ? "Produtor Destinatário" : "Destinatário"}
                </Label>
                {isFranqueado ? (
                  <Select 
                    value={dadosSaida.produtor_destinatario} 
                    onValueChange={(value) => {
                      const produtor = produtores?.find(p => p.user_id === value)
                      setDadosSaida(prev => ({ 
                        ...prev, 
                        produtor_destinatario: value,
                        destinatario: produtor?.nome || ""
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produtor" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtores?.map((produtor) => (
                        <SelectItem key={produtor.user_id} value={produtor.user_id}>
                          {produtor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="destinatario"
                    value={isProdutor ? profile?.nome || "" : dadosSaida.destinatario}
                    onChange={(e) => setDadosSaida(prev => ({ ...prev, destinatario: e.target.value }))}
                    placeholder={isProdutor ? "Seu nome" : "Nome do destinatário"}
                    disabled={isProdutor}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={dadosSaida.observacoes}
                onChange={(e) => setDadosSaida(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder={isProdutor ? "Local de entrega, instruções especiais..." : "Observações sobre a saída..."}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={itens.length === 0}
        >
          Registrar Saída
        </Button>
      </div>
    </div>
  )
}