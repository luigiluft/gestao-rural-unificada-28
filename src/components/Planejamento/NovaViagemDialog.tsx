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
      // Get current user's first deposito_id
      const { data: userProfile } = await supabase.auth.getUser();
      const { data: franquias } = await supabase
        .from('franquias')
        .select('id')
        .limit(1)
        .single();

      const { data: newViagem, error } = await supabase
        .from('viagens')
        .insert({
          numero: data.numero,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim || null,
          observacoes: data.observacoes || null,
          status: 'planejada',
          deposito_id: franquias?.id || '',
          user_id: userProfile.user?.id || '',
        })
        .select()
        .single();

      if (error) throw error;
      return newViagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
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