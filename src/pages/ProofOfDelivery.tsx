import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Clock, 
  User,
  Package
} from 'lucide-react';
import { useMotoristaViagens } from '@/hooks/useMotoristaViagens';
import { useCanAccessPage } from '@/hooks/useSimplifiedPermissions';
import { LoadingState } from '@/components/ui/loading-state';
import { ViagemCard } from '@/components/ProofOfDelivery/ViagemCard';
import { MotoristaPhotoUpload } from '@/components/ProofOfDelivery/MotoristaPhotoUpload';
import { useUpdateNotificationView } from '@/hooks/useNotificationViews';
import { useEffect } from 'react';

const ProofOfDelivery = () => {
  const [selectedViagemId, setSelectedViagemId] = useState<string | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState<string | null>(null)
  
  const { canAccess, isLoading: permissionLoading } = useCanAccessPage('proof-of-delivery')
  const { data: viagens = [], isLoading: viagensLoading, refetch } = useMotoristaViagens()
  const updateNotificationView = useUpdateNotificationView()

  const isLoading = permissionLoading || viagensLoading

  // Mark viagens notifications as viewed when page loads
  useEffect(() => {
    if (!isLoading && canAccess && viagens.length > 0) {
      updateNotificationView.mutate('viagens')
    }
  }, [isLoading, canAccess, viagens.length])

  // Se não tiver permissão, mostrar mensagem
  if (!isLoading && !canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar a página de Proof of Delivery. Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingState />
  }

  // Se está mostrando upload de fotos
  if (showPhotoUpload) {
    const viagem = viagens.find(v => v.id === showPhotoUpload)
    if (!viagem) {
      setShowPhotoUpload(null)
      return null
    }

    return (
      <MotoristaPhotoUpload
        viagem={viagem}
        onVoltar={() => setShowPhotoUpload(null)}
      />
    )
  }

  const viagensPendentes = viagens.filter(v => v.status === 'planejada' || v.status === 'pendente' || v.status === 'em_andamento')
  const viagensFinalizadas = viagens.filter(v => v.status === 'finalizada')
  const viagensEntregues = viagens.filter(v => v.status === 'entregue')

  // Debug logging
  console.log('🚛 Total viagens:', viagens.length)
  console.log('🚛 Viagens por status:', viagens.map(v => ({ id: v.id, status: v.status, numero: v.numero })))
  console.log('🚛 Viagens pendentes:', viagensPendentes.length)
  console.log('🚛 Viagens finalizadas:', viagensFinalizadas.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Minhas Viagens</h1>
                <p className="text-muted-foreground">
                  Gerencie suas viagens e envie comprovantes de entrega
                </p>
              </div>
            </div>
            
            {/* Stats rápidas */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => refetch()} 
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                🔄 Atualizar
              </button>
              <div className="flex gap-4 text-center">
                <div className="px-3 py-2 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{viagensPendentes.length}</div>
                  <div className="text-xs text-orange-600">Pendentes</div>
                </div>
                <div className="px-3 py-2 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{viagensEntregues.length}</div>
                  <div className="text-xs text-green-600">Entregues</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {viagens.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma viagem atribuída</h3>
              <p className="text-muted-foreground text-center">
                Você não possui viagens atribuídas no momento. Entre em contato com o coordenador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Viagens Pendentes */}
            {viagensPendentes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-semibold">Aguardando Ação ({viagensPendentes.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {viagensPendentes.map((viagem) => (
                    <ViagemCard
                      key={viagem.id}
                      viagem={viagem}
                      onVerFotos={(id) => setShowPhotoUpload(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção 'Em Andamento' removida conforme solicitação */}
            {/* Viagens Finalizadas */}
            {viagensFinalizadas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Aguardando Comprovante ({viagensFinalizadas.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {viagensFinalizadas.map((viagem) => (
                    <ViagemCard
                      key={viagem.id}
                      viagem={viagem}
                      onVerFotos={(id) => setShowPhotoUpload(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Viagens Entregues */}
            {viagensEntregues.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold">Concluídas ({viagensEntregues.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {viagensEntregues.map((viagem) => (
                    <ViagemCard
                      key={viagem.id}
                      viagem={viagem}
                      onVerFotos={(id) => setShowPhotoUpload(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProofOfDelivery;