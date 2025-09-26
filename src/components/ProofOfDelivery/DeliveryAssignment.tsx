import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, User, MapPin, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryAssignmentProps {
  deliveryId: string;
  deliveryCode: string;
  clientName: string;
  currentStatus?: string;
}

export const DeliveryAssignment: React.FC<DeliveryAssignmentProps> = ({
  deliveryId,
  deliveryCode,
  clientName,
  currentStatus = 'pendente'
}) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch available drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motoristas')
        .select('id, nome, cpf, auth_user_id')
        .eq('ativo', true)
        .not('auth_user_id', 'is', null); // Only drivers with auth access

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch current assignment
  const { data: currentAssignment } = useQuery({
    queryKey: ['delivery-assignment', deliveryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          motoristas(id, nome, cpf)
        `)
        .eq('comprovante_id', deliveryId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  // Assign driver mutation
  const assignDriver = useMutation({
    mutationFn: async (driverId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (currentAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('delivery_assignments')
          .update({
            motorista_id: driverId,
            status: 'atribuido',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAssignment.id);

        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('delivery_assignments')
          .insert({
            comprovante_id: deliveryId,
            motorista_id: driverId,
            assigned_by: user.id,
            status: 'atribuido'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Motorista atribuído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['delivery-assignment', deliveryId] });
      setSelectedDriver('');
    },
    onError: (error: any) => {
      toast.error('Erro ao atribuir motorista: ' + error.message);
    }
  });

  const handleAssign = () => {
    if (!selectedDriver) {
      toast.error('Selecione um motorista');
      return;
    }
    assignDriver.mutate(selectedDriver);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Atribuição de Motorista
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Entrega:</span> #{deliveryCode}
          </div>
          <div className="text-sm">
            <span className="font-medium">Cliente:</span> {clientName}
          </div>
        </div>

        {currentAssignment ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">
                    {(currentAssignment.motoristas as any)?.nome}
                  </div>
                  <div className="text-sm text-green-700">
                    CPF: {(currentAssignment.motoristas as any)?.cpf}
                  </div>
                </div>
              </div>
              <Badge variant="default">{currentAssignment.status}</Badge>
            </div>
            <div className="mt-2 text-xs text-green-600">
              <Clock className="h-3 w-3 inline mr-1" />
              Atribuído em: {new Date(currentAssignment.assigned_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar motorista..." />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex flex-col">
                        <span>{driver.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          CPF: {driver.cpf}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssign} 
                disabled={!selectedDriver || assignDriver.isPending}
              >
                {assignDriver.isPending ? 'Atribuindo...' : 'Atribuir'}
              </Button>
            </div>
            
            {drivers.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhum motorista disponível. Convide motoristas primeiro.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};