import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Truck, User, Calendar, Clock, Route } from 'lucide-react';

const Viagens = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data para viagens
  const viagens = [
    {
      id: '1',
      numero: 'VG-001',
      rota: 'São Paulo → Rio de Janeiro',
      motorista: 'João Silva',
      veiculo: 'ABC-1234',
      status: 'em_andamento',
      dataInicio: '2024-01-15',
      dataPrevisao: '2024-01-16',
      origem: 'São Paulo, SP',
      destino: 'Rio de Janeiro, RJ',
      distancia: '430 km',
      progresso: 65,
      tempoEstimado: '2h 30min'
    },
    {
      id: '2',
      numero: 'VG-002',
      rota: 'Belo Horizonte → Salvador',
      motorista: 'Maria Santos',
      veiculo: 'DEF-5678',
      status: 'planejada',
      dataInicio: '2024-01-16',
      dataPrevisao: '2024-01-17',
      origem: 'Belo Horizonte, MG',
      destino: 'Salvador, BA',
      distancia: '1200 km',
      progresso: 0,
      tempoEstimado: '18h 00min'
    },
    {
      id: '3',
      numero: 'VG-003',
      rota: 'Curitiba → Porto Alegre',
      motorista: 'Carlos Oliveira',
      veiculo: 'GHI-9012',
      status: 'concluida',
      dataInicio: '2024-01-14',
      dataPrevisao: '2024-01-15',
      origem: 'Curitiba, PR',
      destino: 'Porto Alegre, RS',
      distancia: '710 km',
      progresso: 100,
      tempoEstimado: 'Concluída'
    }
  ];

  const statusBadges = {
    planejada: { label: 'Planejada', variant: 'secondary' as const },
    em_andamento: { label: 'Em Andamento', variant: 'default' as const },
    concluida: { label: 'Concluída', variant: 'outline' as const },
    cancelada: { label: 'Cancelada', variant: 'destructive' as const }
  };

  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = viagem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.rota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.motorista.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calcularProgresso = (viagem: any) => {
    return viagem.progresso;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Viagens</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe as viagens dos veículos da frota
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por número, rota ou motorista..."
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
            <SelectItem value="planejada">Planejada</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.length}</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.filter(v => v.status === 'em_andamento').length}</div>
            <p className="text-xs text-muted-foreground">Viagens ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.filter(v => v.status === 'concluida').length}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KM Percorridos</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.340</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="ativas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ativas">Viagens Ativas</TabsTrigger>
          <TabsTrigger value="todas">Todas as Viagens</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="space-y-4">
          <div className="grid gap-4">
            {filteredViagens.filter(v => v.status === 'em_andamento').map((viagem) => (
              <Card key={viagem.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{viagem.numero}</h3>
                          <p className="text-sm text-muted-foreground">{viagem.rota}</p>
                        </div>
                        <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges].variant}>
                          {statusBadges[viagem.status as keyof typeof statusBadges].label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{viagem.motorista}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>{viagem.veiculo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(viagem.dataInicio).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{viagem.tempoEstimado}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da Viagem</span>
                          <span>{calcularProgresso(viagem)}%</span>
                        </div>
                        <Progress value={calcularProgresso(viagem)} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="todas">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Progresso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViagens.map((viagem) => (
                    <TableRow key={viagem.id}>
                      <TableCell className="font-medium">{viagem.numero}</TableCell>
                      <TableCell>{viagem.rota}</TableCell>
                      <TableCell>{viagem.motorista}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges].variant}>
                          {statusBadges[viagem.status as keyof typeof statusBadges].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(viagem.dataInicio).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={viagem.progresso} className="h-2 w-16" />
                          <span className="text-sm">{viagem.progresso}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Histórico detalhado de viagens estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Viagens;