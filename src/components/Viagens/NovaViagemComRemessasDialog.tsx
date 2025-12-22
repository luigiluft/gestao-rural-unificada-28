import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, DollarSign, User } from 'lucide-react';
import { useViagemComRemessas } from '@/hooks/useViagemComRemessas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useViagens } from '@/hooks/useViagens';
import { useEffect } from 'react';
const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  previsao_inicio: z.string().min(1, 'Previsão de início é obrigatória'),
  observacoes: z.string().optional(),
  motorista_id: z.string().min(1, 'Motorista é obrigatório')
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
  const { data: motoristas = [] } = useMotoristas();
  const { data: viagens = [] } = useViagens();
  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    defaultValues: {
      numero: '',
      previsao_inicio: '',
      observacoes: '',
      motorista_id: undefined
    }
  });

  // Gera número da viagem automaticamente usando timestamp para garantir unicidade
  useEffect(() => {
    if (open) {
      // Usar timestamp para garantir número único mesmo se viagens não forem visíveis por RLS
      const baseNumero = viagens.reduce((max, viagem) => {
        const match = viagem.numero?.match(/V(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      
      // Adiciona timestamp parcial para evitar colisões quando viagens não são visíveis
      const timestamp = Date.now().toString().slice(-4);
      const proximoNumero = `V${String(baseNumero + 1).padStart(3, '0')}-${timestamp}`;
      form.setValue('numero', proximoNumero);
    }
  }, [open, viagens, form]);
  const valorTotal = remessasSelecionadas.reduce((acc, remessa) => acc + (remessa.valor_total || 0), 0);
  const onSubmit = (data: ViagemFormData) => {
    createViagemComRemessas.mutate({
      viagemData: {
        numero: data.numero,
        previsao_inicio: data.previsao_inicio,
        observacoes: data.observacoes,
        motorista_id: data.motorista_id
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Viagem com Remessas Selecionadas</DialogTitle>
        </DialogHeader>
        
        {/* Resumo das Remessas */}
        

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="previsao_inicio" render={({
              field
            }) => <FormItem>
                    <FormLabel>Previsão de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            
            <FormField control={form.control} name="motorista_id" render={({
            field
          }) => <FormItem>
                  <FormLabel>Motorista *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar motorista..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motoristas.map(motorista => <SelectItem key={motorista.id} value={motorista.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span>{motorista.nome}</span>
                              <span className="text-xs text-muted-foreground">
                                CPF: {motorista.cpf}
                              </span>
                            </div>
                          </div>
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            
            <FormField control={form.control} name="observacoes" render={({
            field
          }) => <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre a viagem..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createViagemComRemessas.isPending}>
                {createViagemComRemessas.isPending ? 'Criando...' : 'Criar Viagem'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
};