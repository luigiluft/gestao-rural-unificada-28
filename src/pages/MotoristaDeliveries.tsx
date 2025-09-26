import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  MapPin, 
  Clock, 
  User, 
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/loading-state';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhotoUpload } from '@/components/ProofOfDelivery/PhotoUpload';

const MotoristaDeliveries = () => {
  const { user } = useAuth();
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['motorista-deliveries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('comprovantes_entrega')
        .select(`
          *,
          delivery_assignments!inner(
            id,
            status,
            assigned_at,
            motorista_id,
            motoristas!inner(
              auth_user_id
            )
          )
        `)
        .eq('delivery_assignments.motoristas.auth_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const statusBadges = {
    pendente: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    confirmado: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
    rejeitado: { label: 'Rejeitado', variant: 'destructive' as const, icon: AlertCircle }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (selectedDelivery) {
    const delivery = deliveries.find(d => d.id === selectedDelivery);
    if (!delivery) return null;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedDelivery(null)}
            >
              ← Voltar
            </Button>
            <Badge variant={statusBadges[delivery.status as keyof typeof statusBadges]?.variant}>
              {statusBadges[delivery.status as keyof typeof statusBadges]?.label}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entrega #{delivery.codigo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span>
                  <p>{delivery.cliente_nome}</p>
                </div>
                <div>
                  <span className="font-medium">Produto:</span>
                  <p>{delivery.produto_descricao || 'N/A'}</p>
                </div>
                {delivery.localizacao && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Endereço:</span>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {delivery.localizacao}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <PhotoUpload 
            deliveryId={delivery.id}
            onPhotoUploaded={() => {
              // Refresh the deliveries list
              window.location.reload();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Minhas Entregas</h1>
                <p className="text-sm text-muted-foreground">
                  {deliveries.filter(d => d.status === 'pendente').length} pendentes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma entrega atribuída</h3>
              <p className="text-muted-foreground text-center">
                Você não possui entregas atribuídas no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => {
            const StatusIcon = statusBadges[delivery.status as keyof typeof statusBadges]?.icon || Clock;
            
            return (
              <Card 
                key={delivery.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedDelivery(delivery.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">#{delivery.codigo}</span>
                    </div>
                    <Badge variant={statusBadges[delivery.status as keyof typeof statusBadges]?.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadges[delivery.status as keyof typeof statusBadges]?.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{delivery.cliente_nome}</span>
                    </div>
                    
                    {delivery.localizacao && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-xs line-clamp-2">{delivery.localizacao}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {delivery.tem_assinatura && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Assinado</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          <span>{delivery.total_fotos} fotos</span>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        {delivery.status === 'pendente' ? (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Enviar Comprovante
                          </>
                        ) : (
                          'Ver Detalhes'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MotoristaDeliveries;