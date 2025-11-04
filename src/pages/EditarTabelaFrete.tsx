import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Download, Upload } from 'lucide-react';
import { useTabelasFrete, useUpdateTabelaFrete } from '@/hooks/useTabelasFrete';
import { exportToCSV } from '@/utils/csvExport';
import { importFromCSV } from '@/utils/csvImport';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
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

const EditarTabelaFrete = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateTabelaMutation = useUpdateTabelaFrete();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tabelasFrete = [], isLoading } = useTabelasFrete();
  const tabela = tabelasFrete.find(t => t.id === id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      ativo: true,
      faixas: []
    }
  });

  // Load data when tabela is found
  useEffect(() => {
    if (tabela && tabela.frete_faixas) {
      // Sort faixas by distancia_min
      const sortedFaixas = [...tabela.frete_faixas].sort((a, b) => a.distancia_min - b.distancia_min);
      
      form.reset({
        nome: tabela.nome,
        ativo: tabela.ativo,
        faixas: sortedFaixas.map(f => ({
          distancia_min: f.distancia_min,
          distancia_max: f.distancia_max,
          valor_ate_300kg: f.valor_ate_300kg,
          valor_por_kg_301_999: f.valor_por_kg_301_999,
          pedagio_por_ton: f.pedagio_por_ton,
          prazo_dias: f.prazo_dias
        }))
      });
    }
  }, [tabela, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return;
    
    try {
      await updateTabelaMutation.mutateAsync({
        id,
        nome: values.nome,
        ativo: values.ativo,
        faixas: values.faixas as Array<{
          distancia_min: number;
          distancia_max: number;
          valor_ate_300kg: number;
          valor_por_kg_301_999: number;
          pedagio_por_ton: number;
          prazo_dias: number;
        }>
      });
      navigate(`/tabela-frete/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar tabela:', error);
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
        filename: `tabela-frete-${form.getValues('nome') || 'edicao'}`,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!tabela) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tabelas-frete')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tabela não encontrada</h1>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Editar Tabela de Frete</h1>
          <p className="text-muted-foreground">
            Atualize as faixas de distância e valores da tabela
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
            <Button type="submit" disabled={updateTabelaMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateTabelaMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditarTabelaFrete;
