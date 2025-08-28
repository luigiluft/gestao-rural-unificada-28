import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, RefreshCw } from "lucide-react"
import { RequireAdmin } from "@/components/Auth/RequireAdmin"
import { useConfiguracoesSistema, useUpdateConfiguracao } from "@/hooks/useConfiguracoesSistema"
import { useToast } from "@/hooks/use-toast"

export default function Configuracoes() {
  const { data: configuracoes = [], isLoading } = useConfiguracoesSistema()
  const updateConfiguracao = useUpdateConfiguracao()
  const { toast } = useToast()

  const [pesoMinimo, setPesoMinimo] = useState("")
  const [novoHorario, setNovoHorario] = useState("")
  const [horarios, setHorarios] = useState<string[]>([])
  const [diasUteis, setDiasUteis] = useState("")

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
    <RequireAdmin>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do sistema
          </p>
        </div>

        <div className="space-y-6">
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
    </RequireAdmin>
  )
}