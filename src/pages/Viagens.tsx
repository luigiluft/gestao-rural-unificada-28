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
import { useViagens } from '@/hooks/useViagens';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ViagemKanbanBoard } from '@/components/Viagens/ViagemKanbanBoard';
import { ViagemDetailsDialog } from '@/components/Viagens/ViagemDetailsDialog';

const Viagens = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViagem, setSelectedViagem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: viagens = [], isLoading, error } = useViagens();

  const statusBadges = {
    planejada: { label: 'Planejada', variant: 'secondary' as const },
    em_andamento: { label: 'Em Andamento', variant: 'default' as const },
    entregue: { label: 'Entregue', variant: 'outline' as const },
    confirmada: { label: 'Entregue', variant: 'outline' as const },
    cancelada: { label: 'Cancelada', variant: 'destructive' as const }
  };

  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = viagem.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         viagem.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calcularProgresso = (viagem: any) => {
    if (viagem.status === 'entregue' || viagem.status === 'confirmada') return 100;
    if (viagem.status === 'em_andamento') return 50;
    if (viagem.status === 'planejada') return 10;
    return 0;
  };

  const handleViagemClick = (viagem: any) => {
    setSelectedViagem(viagem);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div>Erro ao carregar viagens: {error.message}</div>;
  }

  return (
    <div className="space-y-6 h-full w-full max-w-full overflow-hidden">
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
            <SelectItem value="entregue">Entregue</SelectItem>
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
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.filter(v => v.status === 'entregue' || v.status === 'confirmada').length}</div>
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
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Timeline Kanban</TabsTrigger>
          <TabsTrigger value="ativas">Viagens Ativas</TabsTrigger>
          <TabsTrigger value="todas">Todas as Viagens</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <ViagemKanbanBoard 
            viagens={filteredViagens}
            onViagemSelect={handleViagemClick}
          />
        </TabsContent>

        <TabsContent value="ativas" className="space-y-4">
          <div className="grid gap-4">
            {filteredViagens.filter(v => v.status === 'em_andamento').length === 0 ? (
              <EmptyState 
                title="Nenhuma viagem em andamento"
                description="Quando houver viagens ativas, elas aparecerão aqui"
              />
            ) : (
              filteredViagens.filter(v => v.status === 'em_andamento').map((viagem) => (
                <Card key={viagem.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViagemClick(viagem)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{viagem.numero}</h3>
                            <p className="text-sm text-muted-foreground">{viagem.observacoes || 'Sem descrição'}</p>
                          </div>
                          <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges]?.variant || 'secondary'}>
                            {statusBadges[viagem.status as keyof typeof statusBadges]?.label || viagem.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{viagem.data_inicio ? new Date(viagem.data_inicio).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{viagem.data_fim ? new Date(viagem.data_fim).toLocaleDateString() : 'N/A'}</span>
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
              ))
            )}
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
                  {filteredViagens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma viagem encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredViagens.map((viagem) => (
                      <TableRow key={viagem.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViagemClick(viagem)}>
                        <TableCell className="font-medium">{viagem.numero}</TableCell>
                        <TableCell>{viagem.observacoes || 'Sem descrição'}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[viagem.status as keyof typeof statusBadges]?.variant || 'secondary'}>
                            {statusBadges[viagem.status as keyof typeof statusBadges]?.label || viagem.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{viagem.data_inicio ? new Date(viagem.data_inicio).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={calcularProgresso(viagem)} className="h-2 w-16" />
                            <span className="text-sm">{calcularProgresso(viagem)}%</span>
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

      {/* Dialog de Detalhes da Viagem */}
      <ViagemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        viagem={selectedViagem}
         onUpdate={() => {
          // Dados serão atualizados via React Query
        }}
      />
    </div>
  );
};

export default Viagens;