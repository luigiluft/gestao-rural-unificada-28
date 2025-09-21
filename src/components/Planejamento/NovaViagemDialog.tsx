import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
});

type ViagemFormData = z.infer<typeof viagemSchema>;

interface NovaViagemDialogProps {
  children?: React.ReactNode;
}

export const NovaViagemDialog = ({ children }: NovaViagemDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    defaultValues: {
      numero: '',
      data_inicio: '',
      data_fim: '',
      observacoes: '',
    },
  });

  const createViagem = useMutation({
    mutationFn: async (data: ViagemFormData) => {
      console.log('🔍 NovaViagemDialog: Creating viagem...', data)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔍 NovaViagemDialog: Current user:', user.id)
      
      // Get user's franquia (deposito)
      const { data: franquia, error: franquiaError } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .maybeSingle();
        
      if (franquiaError) {
        console.error('❌ NovaViagemDialog: Error fetching franquia:', franquiaError)
        throw franquiaError;
      }
      
      if (!franquia) {
        console.log('⚠️ NovaViagemDialog: No franquia found for user, using first available')
        // Fallback: get any active franquia for admin users
        const { data: fallbackFranquia } = await supabase
          .from('franquias')
          .select('id')
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();
          
        if (!fallbackFranquia) {
          throw new Error('Nenhuma franquia encontrada');
        }
        
        console.log('🔍 NovaViagemDialog: Using fallback franquia:', fallbackFranquia.id)
      }

      const viagemData = {
        numero: data.numero,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        observacoes: data.observacoes || null,
        status: 'planejada',
        deposito_id: franquia?.id || '',
        user_id: user.id,
        // Required fields with defaults
        distancia_total: 0,
        distancia_percorrida: 0,
        total_remessas: 0,
        remessas_entregues: 0,
      };
      
      console.log('🔍 NovaViagemDialog: Inserting viagem data:', viagemData)

      const { data: newViagem, error } = await supabase
        .from('viagens')
        .insert(viagemData)
        .select()
        .single();

      if (error) {
        console.error('❌ NovaViagemDialog: Error inserting viagem:', error)
        throw error;
      }
      
      console.log('✅ NovaViagemDialog: Viagem created successfully:', newViagem)
      return newViagem;
    },
    onSuccess: () => {
      // Invalidate both viagens queries
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
      queryClient.invalidateQueries({ queryKey: ['viagens-com-remessas'] });
      toast({ title: 'Viagem criada com sucesso!' });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar viagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ViagemFormData) => {
    createViagem.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Viagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Viagem</DialogTitle>
        </DialogHeader>
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
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createViagem.isPending}>
                {createViagem.isPending ? 'Criando...' : 'Criar Viagem'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};