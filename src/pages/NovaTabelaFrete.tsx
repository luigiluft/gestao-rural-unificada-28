import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateTabelaFrete } from '@/hooks/useTabelasFrete';

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["distancia", "peso", "fixo"]),
  franqueado_id: z.string().uuid(),
  ativo: z.boolean().default(true),
  faixas: z.array(z.object({
    distancia_min: z.number().min(0),
    distancia_max: z.number().min(0),
    valor_ate_300kg: z.number().min(0, "Valor deve ser positivo"),
    valor_por_kg_301_999: z.number().min(0, "Valor deve ser positivo"),
    pedagio_por_ton: z.number().min(0, "Valor deve ser positivo"),
    prazo_dias: z.number().min(1, "Prazo mínimo é 1 dia")
  })).length(10, "Devem ser cadastradas 10 faixas")
});

const faixasPadrao: Array<{
  distancia_min: number;
  distancia_max: number;
  valor_ate_300kg: number;
  valor_por_kg_301_999: number;
  pedagio_por_ton: number;
  prazo_dias: number;
}> = [
  { distancia_min: 0, distancia_max: 50, valor_ate_300kg: 250, valor_por_kg_301_999: 0.80, pedagio_por_ton: 5, prazo_dias: 3 },
  { distancia_min: 51, distancia_max: 150, valor_ate_300kg: 300, valor_por_kg_301_999: 1.00, pedagio_por_ton: 10, prazo_dias: 4 },
  { distancia_min: 151, distancia_max: 300, valor_ate_300kg: 400, valor_por_kg_301_999: 1.20, pedagio_por_ton: 15, prazo_dias: 5 },
  { distancia_min: 301, distancia_max: 500, valor_ate_300kg: 550, valor_por_kg_301_999: 1.40, pedagio_por_ton: 20, prazo_dias: 6 },
  { distancia_min: 501, distancia_max: 800, valor_ate_300kg: 750, valor_por_kg_301_999: 1.60, pedagio_por_ton: 25, prazo_dias: 7 },
  { distancia_min: 801, distancia_max: 1200, valor_ate_300kg: 1000, valor_por_kg_301_999: 1.80, pedagio_por_ton: 30, prazo_dias: 8 },
  { distancia_min: 1201, distancia_max: 1600, valor_ate_300kg: 1300, valor_por_kg_301_999: 2.00, pedagio_por_ton: 35, prazo_dias: 9 },
  { distancia_min: 1601, distancia_max: 2000, valor_ate_300kg: 1600, valor_por_kg_301_999: 2.20, pedagio_por_ton: 40, prazo_dias: 10 },
  { distancia_min: 2001, distancia_max: 2500, valor_ate_300kg: 2000, valor_por_kg_301_999: 2.40, pedagio_por_ton: 45, prazo_dias: 11 },
  { distancia_min: 2501, distancia_max: 3000, valor_ate_300kg: 2500, valor_por_kg_301_999: 2.60, pedagio_por_ton: 50, prazo_dias: 12 }
];

const NovaTabelaFrete = () => {
  const navigate = useNavigate();
  const createTabelaMutation = useCreateTabelaFrete();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "distancia",
      franqueado_id: "a695e2b8-a539-4374-ba04-8c2055c485ea",
      ativo: true,
      faixas: faixasPadrao as Array<{
        distancia_min: number;
        distancia_max: number;
        valor_ate_300kg: number;
        valor_por_kg_301_999: number;
        pedagio_por_ton: number;
        prazo_dias: number;
      }>
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTabelaMutation.mutateAsync({
        franqueado_id: values.franqueado_id,
        nome: values.nome,
        tipo: values.tipo,
        faixas: values.faixas as Array<{
          distancia_min: number;
          distancia_max: number;
          valor_ate_300kg: number;
          valor_por_kg_301_999: number;
          pedagio_por_ton: number;
          prazo_dias: number;
        }>
      });
      navigate('/tabelas-frete');
    } catch (error) {
      console.error('Erro ao criar tabela:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/tabelas-frete')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Tabela de Frete</h1>
          <p className="text-muted-foreground">
            Configure as faixas de distância e valores para a nova tabela
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tabela *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Tabela Regional Sul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="distancia">Por Distância</SelectItem>
                          <SelectItem value="peso">Por Peso</SelectItem>
                          <SelectItem value="fixo">Valor Fixo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tabela Ativa</FormLabel>
                      <FormDescription>
                        Ative esta tabela para que ela possa ser utilizada nos cálculos
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Faixas de Distância */}
          <Card>
            <CardHeader>
              <CardTitle>Faixas de Distância</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os valores para cada faixa de distância (0-3.000 km)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Faixa</TableHead>
                      <TableHead>Distância (km)</TableHead>
                      <TableHead>Valor até 300kg (R$)</TableHead>
                      <TableHead>Valor/kg 301-999kg (R$)</TableHead>
                      <TableHead>Pedágio/ton (R$)</TableHead>
                      <TableHead className="w-[120px]">Prazo (dias)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.watch('faixas').map((faixa, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          Faixa {index + 1}
                        </TableCell>
                        <TableCell>
                          {faixa.distancia_min} - {faixa.distancia_max}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`faixas.${index}.valor_ate_300kg`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="w-32"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`faixas.${index}.valor_por_kg_301_999`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="w-32"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`faixas.${index}.pedagio_por_ton`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="w-28"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`faixas.${index}.prazo_dias`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="w-20"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tabelas-frete')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createTabelaMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createTabelaMutation.isPending ? 'Salvando...' : 'Salvar Tabela'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NovaTabelaFrete;
