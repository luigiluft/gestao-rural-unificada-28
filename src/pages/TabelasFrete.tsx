import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, MapPin, Truck, DollarSign, Plus, Edit, Trash2, Route, Eye, Building2, Search, Globe, Check, X } from 'lucide-react';
import { useTabelasFrete, useDeleteTabelaFrete } from '@/hooks/useTabelasFrete';
import { useTransportadoras } from '@/hooks/useTransportadoras';
import { useSimuladorFrete } from '@/hooks/useSimuladorFrete';
import { useBuscarTransportadoraPlataforma } from '@/hooks/useBuscarTransportadoraPlataforma';
import { useNavigate } from 'react-router-dom';
import { useCliente } from '@/contexts/ClienteContext';
import { useToast } from '@/hooks/use-toast';

const TabelasFrete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCliente } = useCliente();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'proprias' | 'terceiras' | 'publicas'>('todas');
  const [cnpjBusca, setCnpjBusca] = useState('');

  const {
    data: tabelasFrete = [],
    isLoading
  } = useTabelasFrete(selectedCliente?.id);
  const { data: transportadoras } = useTransportadoras(selectedCliente?.id);
  const deleteTabelaMutation = useDeleteTabelaFrete();
  const {
    simulacao,
    setSimulacao,
    calcularFrete
  } = useSimuladorFrete();
  const {
    buscarPorCnpj,
    limpar: limparBusca,
    buscando,
    resultado: transportadoraEncontrada,
    tabelas: tabelasTransportadora
  } = useBuscarTransportadoraPlataforma();

  const filteredTabelas = tabelasFrete.filter(tabela => {
    const matchesSearch = tabela.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo
    if (filtroTipo === 'proprias' && tabela.transportadora_id) return false;
    if (filtroTipo === 'terceiras' && !tabela.transportadora_id) return false;
    if (filtroTipo === 'publicas' && !tabela.publica) return false;
    
    return matchesSearch;
  });

  const handleCalcularFrete = async () => {
    try {
      await calcularFrete();
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
    }
  };

  const handleBuscarTransportadora = async () => {
    if (!cnpjBusca.trim()) {
      toast({
        title: "CNPJ obrigatório",
        description: "Informe o CNPJ da transportadora.",
        variant: "destructive"
      });
      return;
    }

    try {
      const resultado = await buscarPorCnpj(cnpjBusca);
      if (!resultado) {
        toast({
          title: "Transportadora não encontrada",
          description: "Nenhuma empresa encontrada com este CNPJ na plataforma.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar a transportadora.",
        variant: "destructive"
      });
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
        
        <Button onClick={() => navigate('/tabelas-frete/nova')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tabela de Frete
        </Button>
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
            <CardTitle className="text-sm font-medium">Minhas Tabelas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tabelasFrete.filter(t => !t.transportadora_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Próprias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportadoras</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tabelasFrete.filter(t => t.transportadora_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Terceiras</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Públicas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tabelasFrete.filter(t => t.publica).length}
            </div>
            <p className="text-xs text-muted-foreground">Compartilhadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="tabelas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tabelas">Tabelas de Frete</TabsTrigger>
          <TabsTrigger value="buscar">Buscar Transportadora</TabsTrigger>
          <TabsTrigger value="simulador">Simulador de Frete</TabsTrigger>
        </TabsList>

        <TabsContent value="tabelas" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
            <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Tabelas</SelectItem>
                <SelectItem value="proprias">Minhas Tabelas</SelectItem>
                <SelectItem value="terceiras">Transportadoras</SelectItem>
                <SelectItem value="publicas">Públicas</SelectItem>
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
                    <TableHead>Pública</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Carregando tabelas...
                      </TableCell>
                    </TableRow>
                  ) : filteredTabelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma tabela de frete encontrada.
                      </TableCell>
                    </TableRow>
                  ) : filteredTabelas.map(tabela => (
                    <TableRow key={tabela.id}>
                      <TableCell className="font-medium">{tabela.nome}</TableCell>
                      <TableCell>
                        {tabela.transportadora_id ? (
                          <Badge variant="outline" className="gap-1">
                            <Truck className="h-3 w-3" />
                            {(tabela.transportadoras as any)?.nome || 'Terceira'}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            Própria
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{tabela.frete_faixas?.length || 0} faixas</TableCell>
                      <TableCell>
                        <Badge variant={tabela.ativo ? 'default' : 'secondary'}>
                          {tabela.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tabela.publica ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <Globe className="h-3 w-3" />
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(tabela.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/tabela-frete/${tabela.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/tabelas-frete/editar/${tabela.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteTabelaMutation.mutate(tabela.id)} disabled={deleteTabelaMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buscar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Transportadora na Plataforma</CardTitle>
              <CardDescription>
                Pesquise por CNPJ para encontrar transportadoras cadastradas e suas tabelas de frete públicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Digite o CNPJ da transportadora..." 
                    value={cnpjBusca} 
                    onChange={e => setCnpjBusca(e.target.value)}
                  />
                </div>
                <Button onClick={handleBuscarTransportadora} disabled={buscando}>
                  <Search className="h-4 w-4 mr-2" />
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
                {transportadoraEncontrada && (
                  <Button variant="outline" onClick={limparBusca}>
                    Limpar
                  </Button>
                )}
              </div>

              {transportadoraEncontrada && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-400">Transportadora Encontrada</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Razão Social:</strong> {transportadoraEncontrada.razao_social}</p>
                      <p><strong>CNPJ:</strong> {transportadoraEncontrada.cnpj}</p>
                      <p>
                        <strong>Tabelas Públicas:</strong>{' '}
                        {transportadoraEncontrada.tem_tabelas_frete ? (
                          <Badge variant="default">{tabelasTransportadora.length} disponíveis</Badge>
                        ) : (
                          <span className="text-muted-foreground">Nenhuma tabela pública</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tabelasTransportadora.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Tabelas de Frete Disponíveis:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Faixas</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabelasTransportadora.map(tabela => (
                        <TableRow key={tabela.id}>
                          <TableCell className="font-medium">{tabela.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Globe className="h-3 w-3 mr-1" />
                              Pública
                            </Badge>
                          </TableCell>
                          <TableCell>{tabela.frete_faixas?.length || 0} faixas</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/tabela-frete/${tabela.id}`)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
                  <Input id="sim_origem" placeholder="Cidade de origem" value={simulacao.origem} onChange={e => setSimulacao(prev => ({
                    ...prev,
                    origem: e.target.value
                  }))} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_destino">Destino</Label>
                  <Input id="sim_destino" placeholder="Cidade de destino" value={simulacao.destino} onChange={e => setSimulacao(prev => ({
                    ...prev,
                    destino: e.target.value
                  }))} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_distancia">Distância (km)</Label>
                  <Input id="sim_distancia" type="number" placeholder="450" value={simulacao.distancia} onChange={e => setSimulacao(prev => ({
                    ...prev,
                    distancia: e.target.value
                  }))} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sim_peso">Peso (kg)</Label>
                  <Input id="sim_peso" type="number" placeholder="1000" value={simulacao.peso} onChange={e => setSimulacao(prev => ({
                    ...prev,
                    peso: e.target.value
                  }))} />
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
