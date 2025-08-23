import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
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

  React.useEffect(() => {
    if (configuracoes.length > 0) {
      const pesoConfig = configuracoes.find(c => c.chave === "peso_minimo_mopp")
      const horariosConfig = configuracoes.find(c => c.chave === "horarios_retirada")
      
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
        </div>
      </div>
    </RequireAdmin>
  )
}