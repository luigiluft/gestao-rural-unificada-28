import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useCreateDevolucao } from "@/hooks/useCreateDevolucao"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, Package, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DevolucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ocorrenciaId: string
  saidaId: string
  viagemId?: string | null
}

interface SaidaItem {
  id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  lote: string | null
  produtos: {
    nome: string
    codigo: string
    unidade_medida: string
  }
}

export function DevolucaoDialog({ 
  open, 
  onOpenChange, 
  ocorrenciaId, 
  saidaId,
  viagemId 
}: DevolucaoDialogProps) {
  const [tipoDevolucao, setTipoDevolucao] = useState<'total' | 'parcial'>('total')
  const [observacoes, setObservacoes] = useState('')
  const [saidaItens, setSaidaItens] = useState<SaidaItem[]>([])
  const [itensDevolvidos, setItensDevolvidos] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  
  const createDevolucao = useCreateDevolucao()

  // Buscar itens da saída
  useEffect(() => {
    if (open && saidaId) {
      fetchSaidaItens()
    }
  }, [open, saidaId])

  const fetchSaidaItens = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saida_itens')
        .select(`
          id,
          produto_id,
          quantidade,
          valor_unitario,
          lote,
          produtos(nome, codigo, unidade_medida)
        `)
        .eq('saida_id', saidaId)

      if (error) throw error
      setSaidaItens(data || [])
      
      // Inicializar quantidades com zero
      const initialQuantities: Record<string, number> = {}
      data?.forEach(item => {
        initialQuantities[item.id] = 0
      })
      setItensDevolvidos(initialQuantities)
    } catch (error) {
      console.error('Erro ao buscar itens da saída:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (tipoDevolucao === 'parcial') {
      // Validar que ao menos um item foi selecionado
      const hasItems = Object.values(itensDevolvidos).some(qty => qty > 0)
      if (!hasItems) {
        return
      }

      // Construir array de itens devolvidos
      const itensArray = Object.entries(itensDevolvidos)
        .filter(([_, qty]) => qty > 0)
        .map(([saida_item_id, quantidade]) => ({
          saida_item_id,
          quantidade
        }))

      createDevolucao.mutate({
        ocorrencia_id: ocorrenciaId,
        saida_id: saidaId,
        tipo_devolucao: 'parcial',
        itens_devolvidos: itensArray,
        observacoes
      }, {
        onSuccess: () => {
          onOpenChange(false)
          resetForm()
        }
      })
    } else {
      // Devolução total
      createDevolucao.mutate({
        ocorrencia_id: ocorrenciaId,
        saida_id: saidaId,
        tipo_devolucao: 'total',
        observacoes
      }, {
        onSuccess: () => {
          onOpenChange(false)
          resetForm()
        }
      })
    }
  }

  const resetForm = () => {
    setTipoDevolucao('total')
    setObservacoes('')
    setItensDevolvidos({})
  }

  const updateQuantidade = (itemId: string, quantidade: number) => {
    setItensDevolvidos(prev => ({
      ...prev,
      [itemId]: quantidade
    }))
  }

  const isValid = tipoDevolucao === 'total' || Object.values(itensDevolvidos).some(qty => qty > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Devolução de Carga</DialogTitle>
          <DialogDescription>
            Configure os detalhes da devolução da carga relacionada a esta ocorrência.
          </DialogDescription>
        </DialogHeader>

        {viagemId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta saída está vinculada a uma viagem. A devolução poderá impactar o planejamento da viagem.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Tipo de Devolução */}
          <div className="space-y-3">
            <Label>Tipo de Devolução</Label>
            <RadioGroup value={tipoDevolucao} onValueChange={(value: any) => setTipoDevolucao(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="total" />
                <Label htmlFor="total" className="font-normal cursor-pointer">
                  Devolução Total - Toda a carga retorna ao depósito
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parcial" id="parcial" />
                <Label htmlFor="parcial" className="font-normal cursor-pointer">
                  Devolução Parcial - Apenas alguns itens retornam
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Itens (apenas para devolução parcial) */}
          {tipoDevolucao === 'parcial' && (
            <div className="space-y-3">
              <Label>Itens a Devolver</Label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {saidaItens.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.produtos.nome}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Código: {item.produtos.codigo} | Quantidade original: {item.quantidade} {item.produtos.unidade_medida}
                            {item.lote && ` | Lote: ${item.lote}`}
                          </p>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            max={item.quantidade}
                            value={itensDevolvidos[item.id] || 0}
                            onChange={(e) => updateQuantidade(item.id, parseFloat(e.target.value) || 0)}
                            placeholder="Qtd"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Descreva o motivo da devolução e outras informações relevantes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Resumo */}
          <Alert>
            <AlertDescription>
              <strong>Próximos passos:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Uma nova entrada será criada automaticamente no depósito</li>
                <li>O status da saída será atualizado para "Em Devolução"</li>
                <li>Quando a carga chegar, o franqueado deverá confirmar o recebimento</li>
                <li>O estoque será restaurado automaticamente após confirmação</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || createDevolucao.isPending}
          >
            {createDevolucao.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
