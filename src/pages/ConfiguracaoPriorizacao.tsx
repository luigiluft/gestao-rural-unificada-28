import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Save, AlertCircle, Info } from "lucide-react"
import { usePriorizacaoConfig, useUpdatePriorizacaoConfig } from "@/hooks/usePriorizacaoSeparacao"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Fator {
  id: string
  nome: string
  ativo: boolean
  peso: number
  configuracao: any
}

export default function ConfiguracaoPriorizacao() {
  const { user } = useAuth()
  const [franquiaId, setFranquiaId] = useState<string>("")
  const [modo, setModo] = useState<'fifo' | 'customizado'>('fifo')
  const [fatores, setFatores] = useState<Fator[]>([
    {
      id: "performance_sla_produtor",
      nome: "Performance SLA do Produtor",
      ativo: true,
      peso: 25,
      configuracao: { tipo: "historico_sla", periodo_dias: 90 }
    },
    {
      id: "sla_contrato",
      nome: "SLA do Contrato",
      ativo: true,
      peso: 25,
      configuracao: { tipo: "sla_contrato" }
    },
    {
      id: "proximidade_agendamento",
      nome: "Proximidade do Agendamento",
      ativo: true,
      peso: 25,
      configuracao: { tipo: "data" }
    },
    {
      id: "cliente_vip",
      nome: "Cliente VIP / Urgente",
      ativo: true,
      peso: 15,
      configuracao: { tipo: "flag" }
    },
    {
      id: "tempo_fila",
      nome: "Tempo na Fila",
      ativo: true,
      peso: 10,
      configuracao: { tipo: "tempo" }
    }
  ])

  // Buscar franquia do usuário
  useQuery({
    queryKey: ['user-franquia', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .eq('ativo', true)
        .maybeSingle()
      
      if (error) throw error
      if (data) setFranquiaId(data.id)
      return data
    },
    enabled: !!user?.id
  })

  const { data: config, isLoading } = usePriorizacaoConfig(franquiaId)
  const updateConfig = useUpdatePriorizacaoConfig()

  useEffect(() => {
    if (config) {
      setModo(config.modo_priorizacao)
      if (config.fatores && Array.isArray(config.fatores)) {
        setFatores(config.fatores)
      }
    }
  }, [config])

  const pesoTotal = fatores.filter(f => f.ativo).reduce((sum, f) => sum + f.peso, 0)
  const pesoValido = pesoTotal <= 100

  const handleFatorChange = (index: number, field: 'ativo' | 'peso', value: boolean | number) => {
    const novosFatores = [...fatores]
    if (field === 'ativo') {
      novosFatores[index].ativo = value as boolean
    } else {
      novosFatores[index].peso = value as number
    }
    setFatores(novosFatores)
  }

  const handleSave = () => {
    if (!franquiaId) {
      return
    }

    if (modo === 'customizado' && !pesoValido) {
      return
    }

    updateConfig.mutate({
      franquiaId,
      modoPriorizacao: modo,
      fatores
    })
  }

  const getDescricaoFator = (id: string) => {
    const descricoes = {
      performance_sla_produtor: "Prioriza produtores que tiveram mais entregas atrasadas recentemente, considerando o SLA acordado no contrato. Produtores novos começam com 100% (excelente) e perdem pontos conforme acumulam atrasos.",
      sla_contrato: "Prioriza saídas com SLA de entrega mais apertado conforme definido no contrato de serviço.",
      proximidade_agendamento: "Saídas com data de entrega mais próxima recebem maior prioridade.",
      cliente_vip: "Clientes marcados como VIP, Premium ou saídas marcadas como Urgentes têm prioridade elevada.",
      tempo_fila: "Saídas que estão há mais tempo aguardando separação ganham prioridade progressivamente."
    }
    return descricoes[id as keyof typeof descricoes] || ""
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Priorização</h1>
        <p className="text-muted-foreground">
          Defina como as saídas devem ser priorizadas na central de separação
        </p>
      </div>

      {/* Modo de Priorização */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Priorização</CardTitle>
          <CardDescription>
            Escolha entre ordenação simples FIFO ou priorização customizada baseada em múltiplos fatores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-semibold">FIFO (Primeiro a entrar, primeiro a sair)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Ordenação simples por data de criação, sem considerar fatores adicionais
              </p>
            </div>
            <Switch
              checked={modo === 'customizado'}
              onCheckedChange={(checked) => setModo(checked ? 'customizado' : 'fifo')}
            />
            <div className="flex-1 ml-4">
              <Label className="text-base font-semibold">Priorização Customizada</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Baseada em múltiplos fatores configuráveis com pesos ajustáveis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatores de Priorização */}
      {modo === 'customizado' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Fatores de Priorização</CardTitle>
              <CardDescription>
                Configure os fatores e seus pesos. Total de pesos: <strong>{pesoTotal}/100</strong>
                {!pesoValido && (
                  <span className="text-destructive ml-2">(Soma dos pesos não pode exceder 100)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fatores.map((fator, index) => (
                <div key={fator.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={fator.ativo}
                          onCheckedChange={(checked) => handleFatorChange(index, 'ativo', checked)}
                        />
                        <div>
                          <Label className="text-base font-semibold">{fator.nome}</Label>
                          {fator.ativo && (
                            <Badge variant="secondary" className="ml-2">{fator.peso}%</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground ml-11">
                        {getDescricaoFator(fator.id)}
                      </p>
                    </div>
                  </div>
                  
                  {fator.ativo && (
                    <div className="ml-11 space-y-2">
                      <Label className="text-sm">Peso do Fator</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[fator.peso]}
                          onValueChange={([value]) => handleFatorChange(index, 'peso', value)}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12 text-right">{fator.peso}%</span>
                      </div>
                    </div>
                  )}
                  
                  {index < fatores.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {/* Validação de Peso Total */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Distribuição Total de Pesos</Label>
                  <span className={`font-semibold ${pesoValido ? 'text-success' : 'text-destructive'}`}>
                    {pesoTotal}%
                  </span>
                </div>
                <Progress value={pesoTotal} className={pesoTotal > 100 ? 'bg-destructive/20' : ''} />
                {!pesoValido && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A soma dos pesos dos fatores ativos não pode exceder 100%. Ajuste os valores.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong> Cada saída recebe um score (0-100) para cada fator ativo. 
              O score final é calculado multiplicando cada score pelo peso do fator e normalizando o resultado. 
              Saídas com scores mais altos aparecem primeiro na fila de separação.
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={updateConfig.isPending || (modo === 'customizado' && !pesoValido)}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateConfig.isPending ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>
    </div>
  )
}