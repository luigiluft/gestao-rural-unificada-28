import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Calculator, 
  MapPin, 
  Truck, 
  DollarSign, 
  Plus,
  Edit,
  Trash2,
  Route
} from 'lucide-react';
import { useTabelasFrete, useCreateTabelaFrete, useDeleteTabelaFrete } from '@/hooks/useTabelasFrete';
import { useSimuladorFrete } from '@/hooks/useSimuladorFrete';

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().default("regional"),
  franqueado_email: z.string().email("Email inválido")
});

const TabelasFrete = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tabelasFrete = [], isLoading } = useTabelasFrete();
  const createTabelaMutation = useCreateTabelaFrete();
  const deleteTabelaMutation = useDeleteTabelaFrete();
  const { simulacao, setSimulacao, calcularFrete } = useSimuladorFrete();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "regional", 
      franqueado_email: "lucca+2@luft.com.br"
    }
  });

  const tiposBadges = {
    regional: { label: 'Regional', variant: 'default' as const },
    nacional: { label: 'Nacional', variant: 'secondary' as const },
    internacional: { label: 'Internacional', variant: 'outline' as const }
  };

  const filteredTabelas = tabelasFrete.filter(tabela => {
    const matchesSearch = tabela.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'all' || tabela.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // ID do franqueado específico
    const franqueado_id = "a695e2b8-a539-4374-ba04-8c2055c485ea";
    
    // Dados das faixas conforme especificação
    const faixas = [
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

    await createTabelaMutation.mutateAsync({
      franqueado_id,
      nome: values.nome,
      tipo: values.tipo,
      faixas
    });

    setIsDialogOpen(false);
    form.reset();
  };

  const handleCalcularFrete = async () => {
    try {
      await calcularFrete();
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tabelas de Frete</h1>
          <p className="text-muted-foreground">
            Gerencie tabelas de preços e simule custos de frete
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabela
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tabela de Frete</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tabela</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Tabela Padrão" {...field} />
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
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regional">Regional</SelectItem>
                          <SelectItem value="nacional">Nacional</SelectItem>
                          <SelectItem value="internacional">Internacional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="franqueado_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Franqueado</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTabelaMutation.isPending}>
                    {createTabelaMutation.isPending ? 'Salvando...' : 'Criar Tabela'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tabelas</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabelasFrete.length}</div>
            <p className="text-xs text-muted-foreground">Tabelas cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tabelasFrete.filter(t => t.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixas de Distância</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">0-3.000 km</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Franqueados</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Com tabela</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="tabelas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tabelas">Tabelas de Frete</TabsTrigger>
          <TabsTrigger value="simulador">Simulador de Frete</TabsTrigger>
        </TabsList>

        <TabsContent value="tabelas" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="nacional">Nacional</SelectItem>
                <SelectItem value="internacional">Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Fretes */}
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Faixas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando tabelas...
                      </TableCell>
                    </TableRow>
                  ) : filteredTabelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma tabela de frete encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTabelas.map((tabela) => (
                      <TableRow key={tabela.id}>
                        <TableCell className="font-medium">{tabela.nome}</TableCell>
                        <TableCell>
                          <Badge variant={tiposBadges[tabela.tipo as keyof typeof tiposBadges]?.variant || 'default'}>
                            {tiposBadges[tabela.tipo as keyof typeof tiposBadges]?.label || tabela.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{tabela.frete_faixas?.length || 0} faixas</TableCell>
                        <TableCell>
                          <Badge variant={tabela.ativo ? 'default' : 'secondary'}>
                            {tabela.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tabela.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteTabelaMutation.mutate(tabela.id)}
                              disabled={deleteTabelaMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tabela de faixas detalhada */}
          {filteredTabelas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Faixas de Frete</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distância (km)</TableHead>
                      <TableHead>Até 300 kg (R$/viagem)</TableHead>
                      <TableHead>301–999 kg (R$/kg)</TableHead>
                      <TableHead>Pedágio (R$/ton)</TableHead>
                      <TableHead>Prazo (dias)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTabelas[0]?.frete_faixas?.map((faixa) => (
                      <TableRow key={faixa.id}>
                        <TableCell>{faixa.distancia_min}–{faixa.distancia_max}</TableCell>
                        <TableCell>R$ {faixa.valor_ate_300kg.toFixed(2)}</TableCell>
                        <TableCell>R$ {faixa.valor_por_kg_301_999.toFixed(2)}</TableCell>
                        <TableCell>R$ {faixa.pedagio_por_ton.toFixed(2)}</TableCell>
                        <TableCell>D+{faixa.prazo_dias}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulador">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Simulação */}
            <Card>
              <CardHeader>
                <CardTitle>Simulador de Frete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sim_origem">Origem</Label>
                  <Input 
                    id="sim_origem" 
                    placeholder="Cidade de origem" 
                    value={simulacao.origem}
                    onChange={(e) => setSimulacao(prev => ({ ...prev, origem: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_destino">Destino</Label>
                  <Input 
                    id="sim_destino" 
                    placeholder="Cidade de destino" 
                    value={simulacao.destino}
                    onChange={(e) => setSimulacao(prev => ({ ...prev, destino: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_distancia">Distância (km)</Label>
                  <Input 
                    id="sim_distancia" 
                    type="number" 
                    placeholder="450" 
                    value={simulacao.distancia}
                    onChange={(e) => setSimulacao(prev => ({ ...prev, distancia: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_peso">Peso (kg)</Label>
                  <Input 
                    id="sim_peso" 
                    type="number" 
                    placeholder="1000" 
                    value={simulacao.peso}
                    onChange={(e) => setSimulacao(prev => ({ ...prev, peso: e.target.value }))}
                  />
                </div>
                
                <Button onClick={handleCalcularFrete} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Frete
                </Button>
              </CardContent>
            </Card>

            {/* Resultado da Simulação */}
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Simulação</CardTitle>
              </CardHeader>
              <CardContent>
                {simulacao.resultado ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded">
                      <h4 className="font-semibold mb-2">Tabela Aplicada:</h4>
                      <p className="text-sm">{simulacao.resultado.tabela_nome}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Valor do Frete:</span>
                        <span>R$ {simulacao.resultado.valor_frete.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor do Pedágio:</span>
                        <span>R$ {simulacao.resultado.valor_pedagio.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Valor Total:</span>
                          <span>R$ {simulacao.resultado.valor_total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Prazo de entrega: D+{simulacao.resultado.prazo_entrega} dias
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 py-8">
                    <Calculator className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Preencha os dados acima e clique em "Calcular Frete" para ver o resultado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabelasFrete;