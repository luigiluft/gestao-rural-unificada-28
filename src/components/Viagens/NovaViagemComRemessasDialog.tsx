import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, User } from 'lucide-react';
import { useViagemComRemessas } from '@/hooks/useViagemComRemessas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useViagens } from '@/hooks/useViagens';
import { useVeiculosAtivos } from '@/hooks/useVeiculos';
import { useCliente } from '@/contexts/ClienteContext';
import { useEffect } from 'react';

const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  previsao_inicio: z.string().min(1, 'Previsão de início é obrigatória'),
  observacoes: z.string().optional(),
  motorista_id: z.string().min(1, 'Motorista é obrigatório'),
  veiculo_id: z.string().optional(),
  placa_veiculo: z.string().optional(),
  uf_veiculo: z.string().optional()
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
  const { selectedCliente } = useCliente();
  const { data: veiculos = [] } = useVeiculosAtivos(selectedCliente?.id);

  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    defaultValues: {
      numero: '',
      previsao_inicio: '',
      observacoes: '',
      motorista_id: undefined,
      veiculo_id: undefined,
      placa_veiculo: '',
      uf_veiculo: ''
    }
  });

  // Gera número da viagem automaticamente usando timestamp para garantir unicidade
  useEffect(() => {
    if (open) {
      const baseNumero = viagens.reduce((max, viagem) => {
        const match = viagem.numero?.match(/V(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      
      const timestamp = Date.now().toString().slice(-4);
      const proximoNumero = `V${String(baseNumero + 1).padStart(3, '0')}-${timestamp}`;
      form.setValue('numero', proximoNumero);
    }
  }, [open, viagens, form]);

  // Atualiza placa e UF quando veículo é selecionado
  const handleVeiculoChange = (veiculoId: string) => {
    form.setValue('veiculo_id', veiculoId);
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (veiculo) {
      form.setValue('placa_veiculo', veiculo.placa);
      // Extrai UF da placa (formato antigo: ABC-1234 onde UF é determinada pelo padrão)
      // Para simplificar, vamos usar o estado fiscal do cliente ou deixar editável
      // Em veículos brasileiros, a UF geralmente está associada ao registro
      form.setValue('uf_veiculo', selectedCliente?.estado_fiscal || '');
    }
  };

  const valorTotal = remessasSelecionadas.reduce((acc, remessa) => acc + (remessa.valor_total || 0), 0);

  const onSubmit = (data: ViagemFormData) => {
    createViagemComRemessas.mutate({
      viagemData: {
        numero: data.numero,
        previsao_inicio: data.previsao_inicio,
        observacoes: data.observacoes,
        motorista_id: data.motorista_id,
        veiculo_id: data.veiculo_id,
        placa_veiculo: data.placa_veiculo,
        uf_veiculo: data.uf_veiculo
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="previsao_inicio" render={({
              field
            }) => (
              <FormItem>
                <FormLabel>Previsão de Início *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="motorista_id" render={({
              field
            }) => (
              <FormItem>
                <FormLabel>Motorista *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar motorista..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {motoristas.map(motorista => (
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
            )} />

            <FormField control={form.control} name="veiculo_id" render={({
              field
            }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={handleVeiculoChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar veículo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {veiculos.map(veiculo => (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{veiculo.placa} - {veiculo.modelo}</span>
                            <span className="text-xs text-muted-foreground">
                              {veiculo.tipo}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="placa_veiculo" render={({
                field
              }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="uf_veiculo" render={({
                field
              }) => (
                <FormItem>
                  <FormLabel>UF do Veículo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="observacoes" render={({
              field
            }) => (
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observações sobre a viagem..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
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
    </Dialog>
  );
};