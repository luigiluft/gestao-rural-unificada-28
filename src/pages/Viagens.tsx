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
