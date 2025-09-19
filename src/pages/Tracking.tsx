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

const Tracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data para entregas
  const entregas = [
    {
      id: '1',
      codigo: 'ENT-001',
      cliente: 'João Silva',
      endereco: 'Rua das Flores, 123 - São Paulo, SP',
      status: 'em_transito',
      veiculo: 'ABC-1234',
      motorista: 'Carlos Santos',
      dataInicio: '2024-01-15 08:00',
      previsaoEntrega: '2024-01-15 14:00',
      progresso: 75,
      distanciaTotal: '45 km',
      distanciaPercorrida: '34 km',
      tempoRestante: '1h 30min',
      ultimaAtualizacao: '13:45',
      coordenadas: { lat: -23.550520, lng: -46.633308 },
      timeline: [
        { evento: 'Saída do depósito', horario: '08:00', status: 'concluido' },
        { evento: 'Primeiro ponto de parada', horario: '10:30', status: 'concluido' },
        { evento: 'Em rota para destino final', horario: '12:00', status: 'em_andamento' },
        { evento: 'Chegada prevista', horario: '14:00', status: 'pendente' }
      ]
    },
    {
      id: '2',
      codigo: 'ENT-002',
      cliente: 'Maria Santos',
      endereco: 'Av. Principal, 456 - Rio de Janeiro, RJ',
      status: 'entregue',
      veiculo: 'DEF-5678',
      motorista: 'Ana Lima',
      dataInicio: '2024-01-15 09:00',
      previsaoEntrega: '2024-01-15 16:00',
      progresso: 100,
      distanciaTotal: '380 km',
      distanciaPercorrida: '380 km',
      tempoRestante: 'Entregue',
      ultimaAtualizacao: '15:45',
      coordenadas: { lat: -22.906847, lng: -43.172896 },
      timeline: [
        { evento: 'Saída do depósito', horario: '09:00', status: 'concluido' },
        { evento: 'Parada para abastecimento', horario: '12:00', status: 'concluido' },
        { evento: 'Chegada ao destino', horario: '15:45', status: 'concluido' },
        { evento: 'Entrega realizada', horario: '15:50', status: 'concluido' }
      ]
    },
    {
      id: '3',
      codigo: 'ENT-003',
      cliente: 'Pedro Oliveira',
      endereco: 'Rua do Campo, 789 - Belo Horizonte, MG',
      status: 'atrasada',
      veiculo: 'GHI-9012',
      motorista: 'Roberto Silva',
      dataInicio: '2024-01-15 07:00',
      previsaoEntrega: '2024-01-15 13:00',
      progresso: 60,
      distanciaTotal: '520 km',
      distanciaPercorrida: '312 km',
      tempoRestante: '3h 20min',
      ultimaAtualizacao: '14:30',
      coordenadas: { lat: -19.916681, lng: -43.934493 },
      timeline: [
        { evento: 'Saída do depósito', horario: '07:00', status: 'concluido' },
        { evento: 'Primeira parada', horario: '10:00', status: 'concluido' },
        { evento: 'Atraso devido ao trânsito', horario: '13:00', status: 'atrasado' },
        { evento: 'Nova previsão de chegada', horario: '16:20', status: 'pendente' }
      ]
    }
  ];

  const statusBadges = {
    em_transito: { label: 'Em Trânsito', variant: 'default' as const },
    entregue: { label: 'Entregue', variant: 'outline' as const },
    atrasada: { label: 'Atrasada', variant: 'destructive' as const },
    pendente: { label: 'Pendente', variant: 'secondary' as const }
  };

  const filteredEntregas = entregas.filter(entrega => {
    const matchesSearch = entrega.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrega.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrega.motorista.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entrega.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calcularProgresso = (entrega: any) => {
    return entrega.progresso;
  };

  const calcularTempoRestante = (entrega: any) => {
    return entrega.tempoRestante;
  };

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
              {entregas.filter(e => e.status === 'em_transito').length}
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
              {entregas.filter(e => e.status === 'entregue').length}
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
              {entregas.filter(e => e.status === 'atrasada').length}
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
            {filteredEntregas.map((entrega) => (
              <Card key={entrega.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{entrega.codigo}</h3>
                          <Badge variant={statusBadges[entrega.status as keyof typeof statusBadges].variant}>
                            {statusBadges[entrega.status as keyof typeof statusBadges].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliente: {entrega.cliente}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">Tempo Restante</p>
                        <p className="text-muted-foreground">{calcularTempoRestante(entrega)}</p>
                      </div>
                    </div>

                    {/* Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso da Entrega</span>
                        <span>{calcularProgresso(entrega)}%</span>
                      </div>
                      <Progress value={calcularProgresso(entrega)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{entrega.distanciaPercorrida} percorridos</span>
                        <span>{entrega.distanciaTotal} total</span>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Destino:</span>
                        </div>
                        <p className="text-muted-foreground pl-6">{entrega.endereco}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span className="font-medium">Veículo:</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          {entrega.veiculo} - {entrega.motorista}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Última atualização:</span>
                        </div>
                        <p className="text-muted-foreground pl-6">{entrega.ultimaAtualizacao}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Timeline da Entrega</h4>
                      <div className="space-y-2">
                        {entrega.timeline.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              item.status === 'concluido' ? 'bg-green-500 border-green-500' :
                              item.status === 'em_andamento' ? 'bg-blue-500 border-blue-500' :
                              item.status === 'atrasado' ? 'bg-red-500 border-red-500' :
                              'bg-gray-200 border-gray-300'
                            }`} />
                            <span className="flex-1">{item.evento}</span>
                            <span className="text-muted-foreground">{item.horario}</span>
                          </div>
                        ))}
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
            ))}
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