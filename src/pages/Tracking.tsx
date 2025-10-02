import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Truck, 
  Clock, 
  Route, 
  Navigation,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';
import { useViagens } from '@/hooks/useViagens';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const Tracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: viagens = [], isLoading, error } = useViagens();

  const statusBadges = {
    em_andamento: { label: 'Em Trânsito', variant: 'default' as const },
    concluida: { label: 'Entregue', variant: 'outline' as const },
    atrasada: { label: 'Atrasada', variant: 'destructive' as const },
    planejada: { label: 'Pendente', variant: 'secondary' as const }
  };

  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = viagem.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calcularProgresso = (viagem: any) => {
    return viagem.progresso || 0;
  };

  const calcularTempoRestante = (viagem: any) => {
    if (viagem.status === 'entregue') return 'Entregue';
    return 'Calculando...';
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div>Erro ao carregar dados: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracking de Entregas</h1>
        <p className="text-muted-foreground">
          Acompanhe em tempo real todas as entregas em andamento
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por código, cliente ou motorista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="em_transito">Em Trânsito</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="atrasada">Atrasada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.filter(v => v.status === 'em_andamento').length}
            </div>
            <p className="text-xs text-muted-foreground">Entregas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.filter(v => v.status === 'concluida').length}
            </div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viagens.filter(v => v.status === 'atrasada').length}
            </div>
            <p className="text-xs text-muted-foreground">Necessitam atenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KM Percorridos</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,026</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Entregas</TabsTrigger>
          <TabsTrigger value="mapa">Mapa em Tempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="grid gap-4">
            {filteredViagens.length === 0 ? (
              <EmptyState 
                title="Nenhuma viagem para rastrear"
                description="Quando houver viagens ativas, elas aparecerão aqui"
              />
            ) : (
              filteredViagens.map((viagem) => (
                <Card key={viagem.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{viagem.numero}</h3>
                            <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges]?.variant || 'secondary'}>
                              {statusBadges[viagem.status as keyof typeof statusBadges]?.label || viagem.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Viagem: {viagem.observacoes || 'Sem descrição'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">Tempo Restante</p>
                          <p className="text-muted-foreground">{calcularTempoRestante(viagem)}</p>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da Viagem</span>
                          <span>{calcularProgresso(viagem)}%</span>
                        </div>
                        <Progress value={calcularProgresso(viagem)} className="h-2" />
                         <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Em andamento</span>
                           <span>Viagem: {viagem.numero}</span>
                         </div>
                      </div>

                      {/* Detalhes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Informações:</span>
                          </div>
                          <p className="text-muted-foreground pl-6">{viagem.observacoes || 'N/A'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Data Início:</span>
                          </div>
                          <p className="text-muted-foreground pl-6">
                            {viagem.data_inicio ? new Date(viagem.data_inicio).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Previsão Fim:</span>
                          </div>
                          <p className="text-muted-foreground pl-6">
                            {viagem.data_fim ? new Date(viagem.data_fim).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Informações Adicionais */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Informações da Viagem</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-medium">{viagem.status}</span>
                          </div>
                          {viagem.observacoes && (
                            <div className="flex justify-between">
                              <span>Observações:</span>
                              <span className="font-medium">{viagem.observacoes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Navigation className="h-4 w-4 mr-2" />
                          Ver no Mapa
                        </Button>
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Mapa em Tempo Real</h3>
                <p className="text-muted-foreground">
                  A visualização do mapa será implementada em breve. <br />
                  Aqui você poderá acompanhar a localização de todos os veículos em tempo real.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tracking;