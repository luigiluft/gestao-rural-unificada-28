import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Truck, User, Package, DollarSign, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMotoristas } from '@/hooks/useMotoristas';

const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
  motorista_id: z.string().optional(),
});

type ViagemFormData = z.infer<typeof viagemSchema>;

interface ViagemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viagem: any;
  onUpdate?: (viagem: any) => void;
}

const statusBadges = {
  planejada: { label: 'Planejada', variant: 'secondary' as const },
  em_andamento: { label: 'Em Andamento', variant: 'default' as const },
  concluida: { label: 'Concluída', variant: 'outline' as const },
  cancelada: { label: 'Cancelada', variant: 'destructive' as const }
};

export const ViagemDetailsDialog = ({ 
  open, 
  onOpenChange, 
  viagem,
  onUpdate 
}: ViagemDetailsDialogProps) => {
  const { data: motoristas = [] } = useMotoristas();

  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    values: viagem ? {
      numero: viagem.numero || '',
      data_inicio: viagem.data_inicio ? viagem.data_inicio.slice(0, 10) : '',
      data_fim: viagem.data_fim ? viagem.data_fim.slice(0, 10) : '',
      observacoes: viagem.observacoes || '',
      motorista_id: viagem.motorista_id || '',
    } : undefined,
  });

  const onSubmit = (data: ViagemFormData) => {
    // Aqui você pode implementar a lógica de atualização
    console.log('Dados da viagem atualizados:', data);
    if (onUpdate) {
      onUpdate({ ...viagem, ...data });
    }
    onOpenChange(false);
  };

  if (!viagem) return null;

  const statusConfig = statusBadges[viagem.status as keyof typeof statusBadges] || statusBadges.planejada;
  const motoristaAtual = motoristas.find(m => m.id === viagem.motorista_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Viagem {viagem.numero}
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Estatísticas da Viagem */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remessas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.total_remessas || 0}</div>
              <div className="text-xs text-muted-foreground">
                {viagem.remessas_entregues || 0} entregues
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distância</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.distancia_total || 0} km</div>
              <div className="text-xs text-muted-foreground">
                {viagem.distancia_percorrida || 0} km percorridos
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.peso_total || 0} kg</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motorista</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {motoristaAtual ? motoristaAtual.nome : 'Não atribuído'}
              </div>
              {motoristaAtual && (
                <div className="text-xs text-muted-foreground">
                  {motoristaAtual.cpf}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Viagem</FormLabel>
                    <FormControl>
                      <Input placeholder="V001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="motorista_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar motorista..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{motorista.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  CPF: {motorista.cpf}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre a viagem..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informações Adicionais */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Informações da Viagem</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data de Criação:</span>
                  <div className="text-muted-foreground">
                    {viagem.created_at ? format(new Date(viagem.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Última Atualização:</span>
                  <div className="text-muted-foreground">
                    {viagem.updated_at ? format(new Date(viagem.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Hodômetro Início:</span>
                  <div className="text-muted-foreground">
                    {viagem.hodometro_inicio ? `${viagem.hodometro_inicio} km` : 'Não definido'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Hodômetro Fim:</span>
                  <div className="text-muted-foreground">
                    {viagem.hodometro_fim ? `${viagem.hodometro_fim} km` : 'Não definido'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};