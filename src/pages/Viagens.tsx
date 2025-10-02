import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useViagens } from '@/hooks/useViagens';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Truck, MapPin, Package, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Viagens = () => {
  const { data: viagens = [], isLoading, error } = useViagens();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planejada: { label: 'Planejada', variant: 'secondary' as const },
      em_andamento: { label: 'Em Andamento', variant: 'default' as const },
      entregue: { label: 'Entregue', variant: 'outline' as const },
      cancelada: { label: 'Cancelada', variant: 'destructive' as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div>Erro ao carregar viagens: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Viagens</h1>
        <p className="text-muted-foreground">
          Visualize todas as viagens registradas no sistema
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.length}</div>
            <p className="text-xs text-muted-foreground">Todas as viagens</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.filter(v => v.status === 'planejada').length}</div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
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
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagens.filter(v => v.status === 'entregue').length}</div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Viagens */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          {viagens.length === 0 ? (
            <EmptyState 
              title="Nenhuma viagem encontrada"
              description="Não há viagens registradas no sistema"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Remessas</TableHead>
                    <TableHead>Entregues</TableHead>
                    <TableHead>Peso Total (kg)</TableHead>
                    <TableHead>Distância (km)</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Criada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viagens.map((viagem) => {
                    const statusInfo = getStatusBadge(viagem.status);
                    return (
                      <TableRow key={viagem.id}>
                        <TableCell className="font-medium">{viagem.numero}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{viagem.total_remessas || 0}</TableCell>
                        <TableCell>{viagem.remessas_entregues || 0}</TableCell>
                        <TableCell>{viagem.peso_total ? viagem.peso_total.toFixed(0) : '-'}</TableCell>
                        <TableCell>{viagem.distancia_total ? viagem.distancia_total.toFixed(1) : '-'}</TableCell>
                        <TableCell>
                          {viagem.data_inicio 
                            ? new Date(viagem.data_inicio).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {viagem.data_fim 
                            ? new Date(viagem.data_fim).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(viagem.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Viagens;
