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

const TabelasFrete = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');

  // Tabelas de frete será implementada com dados reais em breve
  const tabelasFrete: any[] = [];

  // Mock data para simulação de frete
  const [simulacao, setSimulacao] = useState({
    origem: '',
    destino: '',
    distancia: '',
    peso: '',
    resultado: null as any
  });

  const tiposBadges = {
    regional: { label: 'Regional', variant: 'default' as const },
    nacional: { label: 'Nacional', variant: 'secondary' as const },
    internacional: { label: 'Internacional', variant: 'outline' as const }
  };

  const filteredTabelas = tabelasFrete.filter(tabela => {
    const matchesSearch = tabela.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tabela.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tabela.destino.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'all' || tabela.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const calcularFrete = () => {
    if (!simulacao.distancia || !simulacao.peso) return;
    
    // Encontrar tabela aplicável (simulação simples)
    const tabela = tabelasFrete.find(t => 
      t.ativa && 
      parseFloat(simulacao.distancia) >= t.distancia_min && 
      parseFloat(simulacao.distancia) <= t.distancia_max
    ) || tabelasFrete[0];
    
    const distancia = parseFloat(simulacao.distancia);
    const peso = parseFloat(simulacao.peso);
    
    const valorDistancia = distancia * tabela.valor_por_km;
    const valorPeso = peso * tabela.valor_por_kg;
    const valorTotal = Math.max(tabela.valor_base + valorDistancia + valorPeso, tabela.valor_minimo);
    
    setSimulacao(prev => ({
      ...prev,
      resultado: {
        tabela_aplicada: tabela.nome,
        valor_base: tabela.valor_base,
        valor_distancia: valorDistancia,
        valor_peso: valorPeso,
        valor_total: valorTotal,
        valor_minimo: tabela.valor_minimo
      }
    }));
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
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabela
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Tabela de Frete</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Tabela</Label>
                  <Input id="nome" placeholder="Ex: Tabela São Paulo Capital" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="internacional">Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input id="origem" placeholder="Cidade/Estado de origem" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino</Label>
                  <Input id="destino" placeholder="Região de destino" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dist_min">Distância Mínima (km)</Label>
                  <Input id="dist_min" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dist_max">Distância Máxima (km)</Label>
                  <Input id="dist_max" type="number" placeholder="100" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_base">Valor Base (R$)</Label>
                  <Input id="valor_base" type="number" step="0.01" placeholder="100.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_km">Valor por Km (R$)</Label>
                  <Input id="valor_km" type="number" step="0.01" placeholder="2.50" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_kg">Valor por Kg (R$)</Label>
                  <Input id="valor_kg" type="number" step="0.01" placeholder="0.15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_min">Valor Mínimo (R$)</Label>
                  <Input id="valor_min" type="number" step="0.01" placeholder="80.00" />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Tabela</Button>
              </div>
            </div>
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
              {tabelasFrete.filter(t => t.ativa).length}
            </div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio/Km</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1,97</div>
            <p className="text-xs text-muted-foreground">Média geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regiões Cobertas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Áreas de entrega</p>
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
              placeholder="Buscar por nome, origem ou destino..."
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
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Distância (km)</TableHead>
                    <TableHead>Valor Base</TableHead>
                    <TableHead>Valor/Km</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTabelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhuma tabela de frete encontrada. Esta funcionalidade será implementada em breve.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTabelas.map((tabela) => (
                    <TableRow key={tabela.id}>
                      <TableCell className="font-medium">{tabela.nome}</TableCell>
                      <TableCell>
                        <Badge variant={tiposBadges[tabela.tipo as keyof typeof tiposBadges].variant}>
                          {tiposBadges[tabela.tipo as keyof typeof tiposBadges].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{tabela.origem}</TableCell>
                      <TableCell>{tabela.destino}</TableCell>
                      <TableCell>{tabela.distancia_min} - {tabela.distancia_max}</TableCell>
                      <TableCell>R$ {tabela.valor_base.toFixed(2)}</TableCell>
                      <TableCell>R$ {tabela.valor_por_km.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={tabela.ativa ? 'default' : 'secondary'}>
                          {tabela.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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
                
                <Button onClick={calcularFrete} className="w-full">
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
                      <p className="text-sm">{simulacao.resultado.tabela_aplicada}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Valor Base:</span>
                        <span>R$ {simulacao.resultado.valor_base.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor por Distância:</span>
                        <span>R$ {simulacao.resultado.valor_distancia.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor por Peso:</span>
                        <span>R$ {simulacao.resultado.valor_peso.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Valor Total:</span>
                          <span>R$ {simulacao.resultado.valor_total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor mínimo garantido: R$ {simulacao.resultado.valor_minimo.toFixed(2)}
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