import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, RefreshCw, Package, ListOrdered, Settings2, Store } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useConfiguracoesSistema, useUpdateConfiguracao } from "@/hooks/useConfiguracoesSistema"
import { useToast } from "@/hooks/use-toast"
import { usePriorizacaoConfig } from "@/hooks/usePriorizacaoSeparacao"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useUserRole } from "@/hooks/useUserRole"
import { LojaConfiguracoes } from "@/components/Loja/LojaConfiguracoes"
import { useLojaConfiguracao } from "@/hooks/useLojaConfiguracao"

export default function Configuracoes() {
  const { isCliente } = useUserRole()
  const { configuracao: lojaConfig } = useLojaConfiguracao()
  const { data: configuracoes = [], isLoading } = useConfiguracoesSistema()
  const updateConfiguracao = useUpdateConfiguracao()
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pesoMinimo, setPesoMinimo] = useState("")
  const [novoHorario, setNovoHorario] = useState("")
  const [horarios, setHorarios] = useState<string[]>([])
  const [diasUteis, setDiasUteis] = useState("")
  const [janelaEntregaDias, setJanelaEntregaDias] = useState("")
  const [pesoBrutoMaximo, setPesoBrutoMaximo] = useState("")
  const [metodoSelecaoEstoque, setMetodoSelecaoEstoque] = useState<'fefo' | 'fifo' | 'lifo'>('fefo')
  const [franquiaId, setFranquiaId] = useState<string>("")
  const [periodoAnaliseSLA, setPeriodoAnaliseSLA] = useState<string>("90")

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

  const { data: priorizacaoConfig } = usePriorizacaoConfig(franquiaId)

  React.useEffect(() => {
    if (configuracoes.length > 0) {
      const pesoConfig = configuracoes.find(c => c.chave === "peso_minimo_mopp")
      const horariosConfig = configuracoes.find(c => c.chave === "horarios_retirada")
      const diasUteisConfig = configuracoes.find(c => c.chave === "dias_uteis_expedicao")
      
      if (pesoConfig) {
        setPesoMinimo(pesoConfig.valor)
      }
      
      if (horariosConfig) {
        try {
          setHorarios(JSON.parse(horariosConfig.valor))
        } catch {
          setHorarios([])
        }
      }
      
      if (diasUteisConfig) {
        setDiasUteis(diasUteisConfig.valor)
      }
      
      const janelaEntregaConfig = configuracoes.find(c => c.chave === "janela_entrega_dias")
      if (janelaEntregaConfig) {
        setJanelaEntregaDias(janelaEntregaConfig.valor)
      }
      
      const pesoBrutoConfig = configuracoes.find(c => c.chave === "peso_bruto_maximo_pallet")
      if (pesoBrutoConfig) {
        setPesoBrutoMaximo(pesoBrutoConfig.valor)
      }

      const metodoSelecaoConfig = configuracoes.find(c => c.chave === "metodo_selecao_estoque")
      if (metodoSelecaoConfig) {
        setMetodoSelecaoEstoque(metodoSelecaoConfig.valor as 'fefo' | 'fifo' | 'lifo')
      }

      const periodoAnaliseSLAConfig = configuracoes.find(c => c.chave === "periodo_analise_sla_dias")
      if (periodoAnaliseSLAConfig) {
        setPeriodoAnaliseSLA(periodoAnaliseSLAConfig.valor)
      }
    }
  }, [configuracoes])

  const handleSavePesoMinimo = () => {
    updateConfiguracao.mutate({
      chave: "peso_minimo_mopp",
      valor: pesoMinimo
    })
  }

  const handleAddHorario = () => {
    if (novoHorario && !horarios.includes(novoHorario)) {
      const novosHorarios = [...horarios, novoHorario]
      setHorarios(novosHorarios)
      updateConfiguracao.mutate({
        chave: "horarios_retirada",
        valor: JSON.stringify(novosHorarios)
      })
      setNovoHorario("")
    }
  }

  const handleRemoveHorario = (horario: string) => {
    const novosHorarios = horarios.filter(h => h !== horario)
    setHorarios(novosHorarios)
    updateConfiguracao.mutate({
      chave: "horarios_retirada",
      valor: JSON.stringify(novosHorarios)
    })
  }

  const handleSaveDiasUteis = () => {
    updateConfiguracao.mutate({
      chave: "dias_uteis_expedicao",
      valor: diasUteis
    })
  }

  const handleSaveJanelaEntrega = () => {
    updateConfiguracao.mutate({
      chave: "janela_entrega_dias",
      valor: janelaEntregaDias
    })
  }

  const handleSavePesoBrutoMaximo = () => {
    updateConfiguracao.mutate({
      chave: "peso_bruto_maximo_pallet",
      valor: pesoBrutoMaximo
    })
  }

  const handleSaveMetodoSelecao = () => {
    updateConfiguracao.mutate({
      chave: "metodo_selecao_estoque",
      valor: metodoSelecaoEstoque
    })
  }

  const handleSavePeriodoAnaliseSLA = () => {
    const dias = parseInt(periodoAnaliseSLA)
    if (isNaN(dias) || dias < 7 || dias > 365) {
      toast({
        title: "Período inválido",
        description: "O período deve ser entre 7 e 365 dias",
        variant: "destructive"
      })
      return
    }
    updateConfiguracao.mutate({
      chave: "periodo_analise_sla_dias",
      valor: periodoAnaliseSLA
    })
  }

  const handleClearCache = () => {
    try {
      // Limpar localStorage
      localStorage.clear()
      
      // Limpar sessionStorage  
      sessionStorage.clear()
      
      // Limpar cache do Service Worker se existir
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister())
        })
      }
      
      // Limpar cache do navegador usando Cache API
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      
      toast({
        title: "Cache limpo com sucesso!",
        description: "A página será recarregada automaticamente.",
      })
      
      // Recarregar a página após limpar o cache
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      toast({
        title: "Erro ao limpar cache",
        description: "Tente recarregar a página manualmente.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando configurações...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Configurações de Separação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Configurações de Separação
              </CardTitle>
              <CardDescription>
                Defina como as saídas devem ser priorizadas e como o estoque deve ser selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Priorização de Saídas */}
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ListOrdered className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-semibold">Priorização de Saídas</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Define <strong>qual saída</strong> deve ser separada primeiro na fila de separação.
                    </p>
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Modo atual:</strong>{" "}
                        {priorizacaoConfig?.modo_priorizacao === 'customizado' ? (
                          <Badge variant="secondary">Priorização Customizada</Badge>
                        ) : (
                          <Badge variant="outline">FIFO (Primeira a entrar, primeira a sair)</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/configuracao-priorizacao')}
                  variant="outline"
                  className="w-full"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar Priorização de Saídas
                </Button>
              </div>

              {/* Método de Seleção de Estoque */}
              <div className="space-y-4 pt-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-semibold">Método de Seleção de Estoque</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Define <strong>de qual posição/lote</strong> o produto deve ser retirado ao separar uma saída.
                  </p>
                  
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="metodo-selecao">Método</Label>
                      <Select value={metodoSelecaoEstoque} onValueChange={(value: 'fefo' | 'fifo' | 'lifo') => setMetodoSelecaoEstoque(value)}>
                        <SelectTrigger id="metodo-selecao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fefo">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">FEFO - First Expired, First Out</span>
                              <span className="text-xs text-muted-foreground">Primeiro que vence, primeiro que sai</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="fifo">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">FIFO - First In, First Out</span>
                              <span className="text-xs text-muted-foreground">Primeiro que entrou, primeiro que sai</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="lifo">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">LIFO - Last In, First Out</span>
                              <span className="text-xs text-muted-foreground">Último que entrou, primeiro que sai</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        {metodoSelecaoEstoque === 'fefo' && "Recomendado para produtos perecíveis - prioriza lotes mais próximos do vencimento"}
                        {metodoSelecaoEstoque === 'fifo' && "Recomendado para produtos não perecíveis - prioriza lotes mais antigos"}
                        {metodoSelecaoEstoque === 'lifo' && "Casos específicos - prioriza lotes mais recentes"}
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveMetodoSelecao}
                      disabled={updateConfiguracao.isPending}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Peso Mínimo MOPP */}
          <Card>
            <CardHeader>
              <CardTitle>Peso Mínimo MOPP</CardTitle>
              <CardDescription>
                Defina o peso mínimo (em Kg/L) para exigir MOPP do motorista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="peso-minimo">Peso Mínimo (Kg/L)</Label>
                  <Input
                    id="peso-minimo"
                    type="number"
                    value={pesoMinimo}
                    onChange={(e) => setPesoMinimo(e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <Button 
                  onClick={handleSavePesoMinimo}
                  disabled={updateConfiguracao.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Horários de Retirada */}
          <Card>
            <CardHeader>
              <CardTitle>Horários de Retirada</CardTitle>
              <CardDescription>
                Configure as janelas de horário disponíveis para retirada no depósito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="novo-horario">Novo Horário (formato: HH:MM-HH:MM)</Label>
                  <Input
                    id="novo-horario"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    placeholder="08:00-09:00"
                    pattern="[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}"
                  />
                </div>
                <Button 
                  onClick={handleAddHorario}
                  disabled={!novoHorario || updateConfiguracao.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Horários Configurados:</Label>
                <div className="flex flex-wrap gap-2">
                  {horarios.map((horario) => (
                    <Badge
                      key={horario}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {horario}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveHorario(horario)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                {horarios.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhum horário configurado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Dias Úteis de Expedição */}
          <Card>
            <CardHeader>
              <CardTitle>Dias Úteis de Expedição</CardTitle>
              <CardDescription>
                Configure quantos dias úteis serão bloqueados para agendamento (clientes só poderão agendar após esse período)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="dias-uteis">Número de Dias Úteis</Label>
                  <Input
                    id="dias-uteis"
                    type="number"
                    min="1"
                    max="30"
                    value={diasUteis}
                    onChange={(e) => setDiasUteis(e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Os primeiros {diasUteis || "5"} dias úteis serão bloqueados. Clientes só poderão agendar após esse período.
                  </p>
                </div>
                <Button 
                  onClick={handleSaveDiasUteis}
                  disabled={updateConfiguracao.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Janela de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle>Janela de Entrega</CardTitle>
              <CardDescription>
                Configure quantos dias compõem a janela de entrega a partir da data selecionada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="janela-entrega">Número de Dias</Label>
                  <Input
                    id="janela-entrega"
                    type="number"
                    min="1"
                    max="10"
                    value={janelaEntregaDias}
                    onChange={(e) => setJanelaEntregaDias(e.target.value)}
                    placeholder="3"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Janela de {janelaEntregaDias || "3"} dias. Ex: se selecionar 15/09, a janela será de 15/09 a {
                      parseInt(janelaEntregaDias || "3") === 1 ? "15/09" : `${15 + parseInt(janelaEntregaDias || "3") - 1}/09`
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleSaveJanelaEntrega}
                  disabled={updateConfiguracao.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Peso Bruto Máximo por Pallet */}
          <Card>
            <CardHeader>
              <CardTitle>Peso Bruto Máximo por Pallet</CardTitle>
              <CardDescription>
                Configure o peso bruto máximo permitido por pallet em kg (peso bruto = peso líquido × 1,2)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="peso-bruto-maximo">Peso Bruto Máximo (kg)</Label>
                  <Input
                    id="peso-bruto-maximo"
                    type="number"
                    min="100"
                    max="10000"
                    value={pesoBrutoMaximo}
                    onChange={(e) => setPesoBrutoMaximo(e.target.value)}
                    placeholder="1000"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Peso bruto máximo de {pesoBrutoMaximo || "1000"} kg por pallet. 
                    O sistema validará automaticamente ao adicionar produtos.
                  </p>
                </div>
                <Button 
                  onClick={handleSavePesoBrutoMaximo}
                  disabled={updateConfiguracao.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Período de Análise do SLA */}
          <Card>
            <CardHeader>
              <CardTitle>Período de Análise do SLA</CardTitle>
              <CardDescription>
                Define quantos dias para trás o sistema analisa o histórico de entregas para calcular a performance do produtor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="periodo-analise-sla">Período de Análise (dias)</Label>
                  <Input
                    id="periodo-analise-sla"
                    type="number"
                    min="7"
                    max="365"
                    value={periodoAnaliseSLA}
                    onChange={(e) => setPeriodoAnaliseSLA(e.target.value)}
                    placeholder="90"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Período de {periodoAnaliseSLA || "90"} dias. Recomendado: 90 dias (3 meses). Mínimo: 7 dias. Máximo: 365 dias.
                  </p>
                </div>
                <Button 
                  onClick={handleSavePeriodoAnaliseSLA}
                  disabled={updateConfiguracao.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações da Loja - apenas para clientes com loja habilitada */}
          {isCliente && lojaConfig?.loja_habilitada && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Configurações da Loja
                </CardTitle>
                <CardDescription>
                  Personalize sua loja online e informações de contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LojaConfiguracoes />
              </CardContent>
            </Card>
          )}

          {/* Botão para Limpar Cache */}
          <Card>
            <CardHeader>
              <CardTitle>Cache do Sistema</CardTitle>
              <CardDescription>
                Limpe o cache do navegador se estiver com problemas para ver atualizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleClearCache}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Cache e Recarregar
              </Button>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}