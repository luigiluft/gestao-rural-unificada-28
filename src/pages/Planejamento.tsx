import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Truck, Package, MapPin, Clock } from 'lucide-react';
import { useRemessasDisponiveis } from '@/hooks/useRemessas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAlocarRemessa, useDesalocarRemessa } from '@/hooks/useViagemRemessas';
import { useTotalRemessasAlocadas, useViagemComRemessas } from '@/hooks/useTotalRemessasAlocadas';
import { NovaViagemDialog } from '@/components/Planejamento/NovaViagemDialog';

const Planejamento = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViagem, setSelectedViagem] = useState<string | null>(null);
  
  const { data: viagensComRemessas = [], isLoading: loadingViagens } = useViagemComRemessas();
  const { data: remessasDisponiveis = [], isLoading: loadingRemessas } = useRemessasDisponiveis();
  const { data: totalRemessasAlocadas = 0 } = useTotalRemessasAlocadas();
  const alocarRemessa = useAlocarRemessa();
  const desalocarRemessa = useDesalocarRemessa();

  const viagensPlanejadas = viagensComRemessas.filter(v => v.status === 'planejada');
  const viagensEmAndamento = viagensComRemessas.filter(v => v.status === 'em_andamento');

  const handleAlocarRemessa = (viagemId: string, remessaId: string) => {
    alocarRemessa.mutate({ viagemId, remessaId });
  };

  const handleDesalocarRemessa = (viagemId: string, remessaId: string) => {
    desalocarRemessa.mutate({ viagemId, remessaId });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'planejada': { variant: 'secondary' as const, label: 'Planejada' },
      'em_andamento': { variant: 'default' as const, label: 'Em Andamento' },
      'concluida': { variant: 'outline' as const, label: 'Concluída' },
    };
    return statusMap[status] || { variant: 'secondary' as const, label: status };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planejamento de Viagens</h1>
          <p className="text-muted-foreground">
            Aloque remessas às viagens e otimize a logística de entrega
          </p>
        </div>
        
        <NovaViagemDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viagens Ativas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagensEmAndamento.length}</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viagensPlanejadas.length}</div>
            <p className="text-xs text-muted-foreground">Para executar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remessas Alocadas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemessasAlocadas}</div>
            <p className="text-xs text-muted-foreground">Total nas viagens</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remessasDisponiveis.length}</div>
            <p className="text-xs text-muted-foreground">Sem alocação</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Remessas Disponíveis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Remessas prontas para serem alocadas em viagens
            </p>
          </CardHeader>
          <CardContent>
            {loadingRemessas ? (
              <div className="text-center py-4">Carregando remessas...</div>
            ) : remessasDisponiveis.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma remessa disponível para alocação
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {remessasDisponiveis.map((remessa) => (
                  <div key={remessa.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{remessa.numero}</h4>
                      <p className="text-sm text-muted-foreground">
                        {remessa.peso_total}kg • Vol: {remessa.total_volumes} • R$ {remessa.valor_total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {remessa.status}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Alocar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alocar Remessa à Viagem</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="text-sm">
                            <strong>Remessa:</strong> {remessa.numero}
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Selecione uma viagem:</h4>
                            {viagensPlanejadas.length === 0 ? (
                              <div className="text-muted-foreground text-sm">
                                Nenhuma viagem planejada disponível
                              </div>
                            ) : (
                              viagensPlanejadas.map((viagem) => (
                                <Button
                                  key={viagem.id}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => handleAlocarRemessa(viagem.id, remessa.id)}
                                >
                                   <div className="text-left">
                                     <div className="font-medium">{viagem.numero}</div>
                                     <div className="text-sm text-muted-foreground">
                                        {viagem.viagem_remessas?.length || 0} remessas
                                      </div>
                                   </div>
                                </Button>
                              ))
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Viagens Planejadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Viagens com remessas alocadas
            </p>
          </CardHeader>
          <CardContent>
            {loadingViagens ? (
              <div className="text-center py-4">Carregando viagens...</div>
            ) : viagensComRemessas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma viagem cadastrada
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {viagensComRemessas.map((viagem) => (
                  <div key={viagem.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{viagem.numero}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(viagem.data_inicio).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge {...getStatusBadge(viagem.status)}>
                        {getStatusBadge(viagem.status).label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {viagem.viagem_remessas && viagem.viagem_remessas.length > 0 ? (
                        viagem.viagem_remessas.map((vr: any) => (
                          <div key={vr.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="text-sm">
                              <span className="font-medium">{vr.remessas?.numero}</span>
                              <span className="text-muted-foreground ml-2">
                                ({vr.remessas?.peso_total}kg • {vr.remessas?.total_volumes} vol.)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDesalocarRemessa(viagem.id, vr.remessa_id)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhuma remessa alocada para esta viagem
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Planejamento;