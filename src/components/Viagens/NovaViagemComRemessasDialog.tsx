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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, DollarSign } from 'lucide-react';
import { useViagemComRemessas } from '@/hooks/useViagemComRemessas';

const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
});

type ViagemFormData = z.infer<typeof viagemSchema>;

interface RemessaSelecionada {
  id: string;
  valor_total?: number;
  observacoes?: string;
}

interface NovaViagemComRemessasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remessasSelecionadas: RemessaSelecionada[];
  onSuccess: () => void;
}

export const NovaViagemComRemessasDialog = ({ 
  open, 
  onOpenChange, 
  remessasSelecionadas,
  onSuccess 
}: NovaViagemComRemessasDialogProps) => {
  const createViagemComRemessas = useViagemComRemessas();

  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    defaultValues: {
      numero: '',
      data_inicio: '',
      data_fim: '',
      observacoes: '',
    },
  });

  const valorTotal = remessasSelecionadas.reduce((acc, remessa) => acc + (remessa.valor_total || 0), 0);

  const onSubmit = (data: ViagemFormData) => {
    createViagemComRemessas.mutate({
      viagemData: {
        numero: data.numero,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        observacoes: data.observacoes,
      },
      remessasIds: remessasSelecionadas.map(r => r.id)
    }, {
      onSuccess: () => {
        form.reset();
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Viagem com Remessas Selecionadas</DialogTitle>
        </DialogHeader>
        
        {/* Resumo das Remessas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remessas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{remessasSelecionadas.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {remessasSelecionadas.length > 0 ? (valorTotal / remessasSelecionadas.length).toLocaleString() : '0'}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {valorTotal.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Data de Fim (Opcional)</FormLabel>
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
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre a viagem..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createViagemComRemessas.isPending}>
                {createViagemComRemessas.isPending ? 'Criando...' : 'Criar Viagem'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};