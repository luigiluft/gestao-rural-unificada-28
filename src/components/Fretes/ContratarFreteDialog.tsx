import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, User, Building2, DollarSign, Clock, Package, Calculator } from 'lucide-react';
import { useCliente } from '@/contexts/ClienteContext';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useTransportadoras } from '@/hooks/useTransportadoras';
import { useTabelasFrete } from '@/hooks/useTabelasFrete';
import { useCalcularFreteMultiplasTabelas, ResultadoFreteTabela } from '@/hooks/useCalcularFreteMultiplasTabelas';
import { useCreateFrete } from '@/hooks/useFretes';
import { Embarque } from '@/hooks/useEmbarques';
import { toast } from 'sonner';

const freteSchema = z.object({
  executor_type: z.enum(['FROTA_PROPRIA', 'AGREGADO', 'TRANSPORTADORA_PARCEIRA']),
  motorista_id: z.string().optional(),
  veiculo_id: z.string().optional(),
  transportadora_parceira_id: z.string().optional(),
  tabela_frete_id: z.string().optional(),
  motorista_agregado_cpf: z.string().optional(),
  motorista_agregado_nome: z.string().optional(),
  preco_cobrado: z.number().min(0, 'Preço deve ser positivo'),
  custo_frete: z.number().min(0, 'Custo deve ser positivo'),
  sla_prazo_horas: z.number().optional(),
  observacoes: z.string().optional(),
});

type FreteFormData = z.infer<typeof freteSchema>;

interface ContratarFreteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: Embarque;
  distancia?: number;
  peso?: number;
  onSuccess?: () => void;
}

export const ContratarFreteDialog = ({
  open,
  onOpenChange,
  embarque,
  distancia = 0,
  peso = 0,
  onSuccess,
}: ContratarFreteDialogProps) => {
  const { selectedCliente } = useCliente();
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: transportadoras = [] } = useTransportadoras();
  const { data: tabelasFrete = [] } = useTabelasFrete();
  const { calcularFreteTodasTabelas, calculando } = useCalcularFreteMultiplasTabelas();
  const createFrete = useCreateFrete();
  
  const [cotacoes, setCotacoes] = useState<ResultadoFreteTabela[]>([]);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState<ResultadoFreteTabela | null>(null);

  const form = useForm<FreteFormData>({
    resolver: zodResolver(freteSchema),
    defaultValues: {
      executor_type: 'FROTA_PROPRIA',
      preco_cobrado: 0,
      custo_frete: 0,
    },
  });

  const executorType = form.watch('executor_type');

  // Filtrar motoristas e veículos por tipo
  const motoristasProprios = motoristas.filter(m => m.tipo === 'PROPRIO' || !m.tipo);
  const motoristasAgregados = motoristas.filter(m => m.tipo === 'AGREGADO');
  const veiculosProprios = veiculos.filter(v => v.tipo_propriedade === 'PROPRIO' || !v.tipo_propriedade);

  // Buscar cotações quando o diálogo abre
  useEffect(() => {
    const buscarCotacoes = async () => {
      if (!open || !selectedCliente?.id || distancia <= 0 || peso <= 0) return;
      
      try {
        // Por enquanto vamos usar uma lógica simplificada
        // Em produção, isso buscaria de franquias associadas ao cliente
        const resultados = await calcularFreteTodasTabelas(
          selectedCliente.id, // Usando cliente_id como proxy
          distancia,
          peso
        );
        setCotacoes(resultados);
      } catch (error) {
        console.log('Nenhuma tabela de frete encontrada para cotação');
        setCotacoes([]);
      }
    };

    buscarCotacoes();
  }, [open, selectedCliente?.id, distancia, peso]);

  const handleSelecionarCotacao = (cotacao: ResultadoFreteTabela) => {
    setCotacaoSelecionada(cotacao);
    form.setValue('preco_cobrado', cotacao.valor_total);
    form.setValue('custo_frete', cotacao.valor_total * 0.85); // Estimativa de custo
    form.setValue('tabela_frete_id', cotacao.tabela_id);
    
    if (cotacao.is_propria) {
      form.setValue('executor_type', 'FROTA_PROPRIA');
    } else {
      form.setValue('executor_type', 'TRANSPORTADORA_PARCEIRA');
    }
  };

  const onSubmit = async (data: FreteFormData) => {
    if (!selectedCliente?.id) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }

    try {
      await createFrete.mutateAsync({
        cliente_id: selectedCliente.id,
        embarque_id: embarque.id,
        executor_type: data.executor_type,
        origin_type: embarque.tipo_origem === 'BASE_PROPRIA' ? 'BASE_PROPRIA' : 'COLETA',
        motorista_id: data.executor_type === 'FROTA_PROPRIA' ? data.motorista_id : null,
        veiculo_id: data.executor_type === 'FROTA_PROPRIA' ? data.veiculo_id : null,
        transportadora_parceira_id: data.executor_type === 'TRANSPORTADORA_PARCEIRA' ? data.transportadora_parceira_id : null,
        tabela_frete_id: data.tabela_frete_id || null,
        motorista_agregado_cpf: data.executor_type === 'AGREGADO' ? data.motorista_agregado_cpf : null,
        motorista_agregado_nome: data.executor_type === 'AGREGADO' ? data.motorista_agregado_nome : null,
        preco_cobrado: data.preco_cobrado,
        custo_frete: data.custo_frete,
        sla_prazo_horas: data.sla_prazo_horas || null,
        status: 'pendente',
        observacoes: data.observacoes || null,
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao contratar frete:', error);
    }
  };

  const margemCalculada = form.watch('preco_cobrado') - form.watch('custo_frete');
  const margemPercentual = form.watch('preco_cobrado') > 0 
    ? ((margemCalculada / form.watch('preco_cobrado')) * 100).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Contratar Frete - Embarque {embarque.numero}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo do Embarque */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Peso</span>
              </div>
              <div className="text-xl font-bold">{(embarque.peso_total || peso).toFixed(0)} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Distância</span>
              </div>
              <div className="text-xl font-bold">{distancia.toFixed(0)} km</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Destinos</span>
              </div>
              <div className="text-xl font-bold">{embarque.destinos?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Cotações Automáticas */}
        {cotacoes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Cotações Disponíveis
              </h4>
              <div className="grid gap-2">
                {cotacoes.slice(0, 5).map((cotacao) => (
                  <Card 
                    key={cotacao.tabela_id}
                    className={`cursor-pointer transition-colors ${
                      cotacaoSelecionada?.tabela_id === cotacao.tabela_id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelecionarCotacao(cotacao)}
                  >
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={cotacao.is_propria ? 'default' : 'secondary'}>
                          {cotacao.is_propria ? 'Frota Própria' : 'Terceiro'}
                        </Badge>
                        <div>
                          <div className="font-medium">{cotacao.tabela_nome}</div>
                          {cotacao.transportadora_nome && (
                            <div className="text-sm text-muted-foreground">
                              {cotacao.transportadora_nome}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          R$ {cotacao.valor_total.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Prazo: {cotacao.prazo_entrega} dias
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de Execução */}
            <FormField
              control={form.control}
              name="executor_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Execução *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FROTA_PROPRIA">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Frota Própria
                        </div>
                      </SelectItem>
                      <SelectItem value="AGREGADO">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Motorista Agregado
                        </div>
                      </SelectItem>
                      <SelectItem value="TRANSPORTADORA_PARCEIRA">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Transportadora Parceira
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionais por tipo */}
            {executorType === 'FROTA_PROPRIA' && (
              <div className="grid grid-cols-2 gap-4">
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
                          {motoristasProprios.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="veiculo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar veículo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {veiculosProprios.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.placa} - {v.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {executorType === 'AGREGADO' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="motorista_agregado_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista Agregado</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motorista_agregado_cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Motorista</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {executorType === 'TRANSPORTADORA_PARCEIRA' && (
              <FormField
                control={form.control}
                name="transportadora_parceira_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportadora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar transportadora..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transportadoras.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Valores */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="preco_cobrado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Cobrado (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custo_frete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo do Frete (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Margem</FormLabel>
                <div className={`text-xl font-bold ${margemCalculada >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {margemCalculada.toFixed(2)} ({margemPercentual}%)
                </div>
              </div>
            </div>

            {/* SLA e Observações */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sla_prazo_horas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo SLA (horas)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 48"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
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
                    <Textarea placeholder="Observações sobre o frete..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFrete.isPending}>
                {createFrete.isPending ? 'Contratando...' : 'Contratar Frete'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
