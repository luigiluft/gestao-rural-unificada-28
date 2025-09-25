import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Truck,
  MapPin,
  Clock,
  Package,
  Play,
  Square,
  Camera,
  FileText,
  Fuel,
  Gauge
} from 'lucide-react'
import { ViagemMotorista, useIniciarViagem, useFinalizarViagem } from '@/hooks/useMotoristaViagens'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ViagemCardProps {
  viagem: ViagemMotorista
  onVerFotos: (viagemId: string) => void
}

export const ViagemCard: React.FC<ViagemCardProps> = ({ viagem, onVerFotos }) => {
  const [showIniciarDialog, setShowIniciarDialog] = useState(false)
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false)
  const [hodometroInicio, setHodometroInicio] = useState<string>('')
  const [combustivelInicio, setCombustivelInicio] = useState<string>('')
  const [hodometroFim, setHodometroFim] = useState<string>('')
  const [combustivelFim, setCombustivelFim] = useState<string>('')
  const [observacoes, setObservacoes] = useState<string>('')

  const iniciarViagemMutation = useIniciarViagem()
  const finalizarViagemMutation = useFinalizarViagem()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'secondary'
      case 'em_andamento': return 'default'
      case 'finalizada': return 'outline'
      case 'entregue': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return Clock
      case 'em_andamento': return Truck
      case 'finalizada': return Square
      case 'entregue': return Package
      default: return Clock
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Aguardando Início'
      case 'em_andamento': return 'Em Andamento'
      case 'finalizada': return 'Finalizada'
      case 'entregue': return 'Entregue'
      default: return status
    }
  }

  const handleIniciarViagem = () => {
    iniciarViagemMutation.mutate({
      viagemId: viagem.id,
      hodometroInicio: hodometroInicio ? parseFloat(hodometroInicio) : undefined,
      combustivelInicio: combustivelInicio ? parseFloat(combustivelInicio) : undefined
    })
    setShowIniciarDialog(false)
    setHodometroInicio('')
    setCombustivelInicio('')
  }

  const handleFinalizarViagem = () => {
    finalizarViagemMutation.mutate({
      viagemId: viagem.id,
      hodometroFim: hodometroFim ? parseFloat(hodometroFim) : undefined,
      combustivelFim: combustivelFim ? parseFloat(combustivelFim) : undefined,
      observacoes: observacoes || undefined
    })
    setShowFinalizarDialog(false)
    setHodometroFim('')
    setCombustivelFim('')
    setObservacoes('')
  }

  const StatusIcon = getStatusIcon(viagem.status)
  const canStart = viagem.status === 'pendente'
  const canFinalize = viagem.status === 'em_andamento'
  const canViewPhotos = viagem.status === 'em_andamento' || viagem.status === 'finalizada'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Viagem #{viagem.numero}
          </CardTitle>
          <Badge variant={getStatusVariant(viagem.status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {getStatusLabel(viagem.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações da Viagem */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{viagem.remessas_entregues}/{viagem.total_remessas} entregas</span>
            </div>
            {viagem.veiculos && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>{viagem.veiculos.placa} - {viagem.veiculos.modelo}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{viagem.distancia_total.toFixed(1)} km</span>
            </div>
            {viagem.peso_total && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{viagem.peso_total.toFixed(0)} kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Tempo */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3" />
            <span>Criada {formatDistanceToNow(new Date(viagem.created_at), { locale: ptBR, addSuffix: true })}</span>
          </div>
          {viagem.data_inicio && (
            <div className="flex items-center gap-2">
              <Play className="h-3 w-3" />
              <span>Iniciada {formatDistanceToNow(new Date(viagem.data_inicio), { locale: ptBR, addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Depósito */}
        {viagem.deposito && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Depósito:</span> {viagem.deposito.nome}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {canStart && (
            <Dialog open={showIniciarDialog} onOpenChange={setShowIniciarDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1" disabled={iniciarViagemMutation.isPending}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Viagem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Viagem #{viagem.numero}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hodometro-inicio">Hodômetro Inicial (km)</Label>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="hodometro-inicio"
                        type="number"
                        placeholder="Ex: 45230"
                        value={hodometroInicio}
                        onChange={(e) => setHodometroInicio(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="combustivel-inicio">Combustível Inicial (%)</Label>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="combustivel-inicio"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ex: 80"
                        value={combustivelInicio}
                        onChange={(e) => setCombustivelInicio(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowIniciarDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleIniciarViagem} disabled={iniciarViagemMutation.isPending}>
                      Iniciar Viagem
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canFinalize && (
            <Dialog open={showFinalizarDialog} onOpenChange={setShowFinalizarDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" disabled={finalizarViagemMutation.isPending}>
                  <Square className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Viagem #{viagem.numero}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hodometro-fim">Hodômetro Final (km)</Label>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="hodometro-fim"
                        type="number"
                        placeholder="Ex: 45350"
                        value={hodometroFim}
                        onChange={(e) => setHodometroFim(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="combustivel-fim">Combustível Final (%)</Label>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="combustivel-fim"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ex: 40"
                        value={combustivelFim}
                        onChange={(e) => setCombustivelFim(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Adicione observações sobre a viagem..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowFinalizarDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleFinalizarViagem} disabled={finalizarViagemMutation.isPending}>
                      Finalizar Viagem
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canViewPhotos && (
            <Button
              variant="outline"
              onClick={() => onVerFotos(viagem.id)}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Enviar Fotos
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}