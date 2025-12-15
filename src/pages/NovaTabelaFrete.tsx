import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Download, Upload, AlertCircle } from 'lucide-react';
import { useCreateTabelaFrete } from '@/hooks/useTabelasFrete';
import { useTransportadoras } from '@/hooks/useTransportadoras';
import { exportToCSV } from '@/utils/csvExport';
import { importFromCSV } from '@/utils/csvImport';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCliente } from '@/contexts/ClienteContext';

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  transportadora_id: z.string().uuid("Selecione uma transportadora"),
  ativo: z.boolean().default(true),
  publica: z.boolean().default(false),
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
  const { selectedCliente } = useCliente();
  const { data: transportadoras = [] } = useTransportadoras(selectedCliente?.id);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transportadorasAtivas = transportadoras.filter(t => t.ativo);

  // Normaliza CNPJ removendo pontuação para comparação
  const normalizeCnpj = (cnpj: string) => cnpj?.replace(/[^\d]/g, "") || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      transportadora_id: "",
      ativo: true,
      publica: false,
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

  // Auto-selecionar se tiver apenas 1 transportadora
  useEffect(() => {
    if (transportadorasAtivas.length === 1 && !form.getValues("transportadora_id")) {
      form.setValue("transportadora_id", transportadorasAtivas[0].id);
    }
  }, [transportadorasAtivas, form]);

  // Verificar se transportadora selecionada é própria (CNPJ igual ao da empresa)
  const transportadoraId = form.watch("transportadora_id");
  const transportadoraSelecionada = transportadorasAtivas.find(t => t.id === transportadoraId);
  const isPropria = transportadoraSelecionada && 
    normalizeCnpj(transportadoraSelecionada.cnpj) === normalizeCnpj(selectedCliente?.cpf_cnpj || "");

  // Reset publica quando trocar para transportadora terceira
  useEffect(() => {
    if (!isPropria) {
      form.setValue("publica", false);
    }
  }, [isPropria, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedCliente) {
      toast({
        title: "Empresa não selecionada",
        description: "Selecione uma empresa no menu superior.",
        variant: "destructive"
      });
      return;
    }

    // Validar se tem transportadora cadastrada
    if (transportadorasAtivas.length === 0) {
      toast({
        title: "Nenhuma transportadora cadastrada",
        description: "Cadastre uma transportadora antes de criar tabelas de frete.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createTabelaMutation.mutateAsync({
        cliente_id: selectedCliente.id,
        nome: values.nome,
        tipo: isPropria ? "propria" : "terceira",
        transportadora_id: values.transportadora_id,
        publica: values.publica,
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

  const handleExportCSV = () => {
    try {
      const faixas = form.getValues('faixas');
      
      const columns = [
        { key: 'distancia_min', label: 'Distância Mínima (km)', visible: true },
        { key: 'distancia_max', label: 'Distância Máxima (km)', visible: true },
        { key: 'valor_ate_300kg', label: 'Valor até 300kg', visible: true },
        { key: 'valor_por_kg_301_999', label: 'Valor por kg (301-999kg)', visible: true },
        { key: 'pedagio_por_ton', label: 'Pedágio por ton', visible: true },
        { key: 'prazo_dias', label: 'Prazo (dias)', visible: true },
      ];

      exportToCSV({
        data: faixas,
        columns,
        filename: `tabela-frete-${form.getValues('nome') || 'nova'}`,
      });

      toast({
        title: "CSV exportado com sucesso",
        description: "O arquivo foi baixado para o seu computador",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar CSV",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importFromCSV(file);
      
      if (result.errors.length > 0) {
        toast({
          title: "Avisos durante importação",
          description: result.errors.join('\n'),
          variant: "destructive",
        });
      }

      if (result.data.length > 0) {
        // Map CSV data to form fields
        const faixas = result.data.map((row: any) => ({
          distancia_min: row['Distância Mínima (km)'] || row.distancia_min || 0,
          distancia_max: row['Distância Máxima (km)'] || row.distancia_max || 0,
          valor_ate_300kg: row['Valor até 300kg'] || row.valor_ate_300kg || 0,
          valor_por_kg_301_999: row['Valor por kg (301-999kg)'] || row.valor_por_kg_301_999 || 0,
          pedagio_por_ton: row['Pedágio por ton'] || row.pedagio_por_ton || 0,
          prazo_dias: row['Prazo (dias)'] || row.prazo_dias || 0,
        }));

        form.setValue('faixas', faixas);
        
        toast({
          title: "CSV importado com sucesso",
          description: `${result.data.length} faixas foram carregadas`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao importar CSV",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              {transportadorasAtivas.length === 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você precisa cadastrar uma transportadora antes de criar tabelas de frete.
                    <Button 
                      variant="link" 
                      className="h-auto p-0 ml-1"
                      onClick={() => navigate('/transportadoras')}
                    >
                      Cadastrar agora
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="transportadora_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transportadora *</FormLabel>
                    <FormDescription>
                      Selecione a transportadora para esta tabela de frete
                    </FormDescription>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a transportadora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transportadorasAtivas.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nome} - {t.cnpj}
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
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Tabela *</FormLabel>
                    <FormDescription>
                      Ex: "Tabela de Frete Normal", "Tabela de Frete Expresso"
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="Ex: Tabela de Frete Normal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {isPropria && (
                <FormField
                  control={form.control}
                  name="publica"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tornar Pública</FormLabel>
                        <FormDescription>
                          Permite que outras empresas vejam e usem esta tabela de frete
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
              )}
            </CardContent>
          </Card>

          {/* Faixas de Distância */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Faixas de Distância</CardTitle>
                  <CardDescription>
                    Configure os valores para cada faixa de distância (0-3.000 km)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </div>
              </div>
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
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
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
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
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
                                    className="w-32"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
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
                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
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

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tabelas-frete')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTabelaMutation.isPending || transportadorasAtivas.length === 0}
            >
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
