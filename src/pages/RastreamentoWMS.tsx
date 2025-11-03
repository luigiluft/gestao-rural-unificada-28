import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  PackageCheck, 
  PackageOpen, 
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const RastreamentoWMS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // TODO: Integrar com dados reais do WMS
  const isLoading = false;

  const statusBadges = {
    recebimento: { label: 'Em Recebimento', variant: 'default' as const },
    armazenagem: { label: 'Armazenado', variant: 'secondary' as const },
    separacao: { label: 'Em Separação', variant: 'default' as const },
    expedicao: { label: 'Em Expedição', variant: 'default' as const },
    concluido: { label: 'Concluído', variant: 'outline' as const }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rastreamento WMS</h1>
        <meta name="description" content="Monitore em tempo real o fluxo de movimentações dentro do armazém: recebimento, armazenagem, separação e expedição." />
        <p className="text-muted-foreground">
          Acompanhe em tempo real o fluxo de operações dentro do armazém
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por código, produto ou lote..."
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
            <SelectItem value="recebimento">Em Recebimento</SelectItem>
            <SelectItem value="armazenagem">Armazenado</SelectItem>
            <SelectItem value="separacao">Em Separação</SelectItem>
            <SelectItem value="expedicao">Em Expedição</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Recebimento</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Entradas aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Separação</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pedidos em processo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Expedição</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando despacho</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Processos finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="fluxo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fluxo">Fluxo de Operações</TabsTrigger>
          <TabsTrigger value="posicoes">Posições em Tempo Real</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações em Andamento</CardTitle>
              <CardDescription>
                Acompanhe todas as operações em execução no armazém
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState 
                title="Nenhuma movimentação ativa"
                description="Quando houver operações em andamento, elas aparecerão aqui"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posicoes">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Posições</CardTitle>
              <CardDescription>
                Visualização em tempo real da ocupação do armazém
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4 py-8">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Visualização de Posições</h3>
                <p className="text-muted-foreground">
                  O mapa 3D do armazém com ocupação em tempo real será exibido aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Performance</CardTitle>
              <CardDescription>
                Métricas e KPIs das operações do armazém
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4 py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Análise de Performance</h3>
                <p className="text-muted-foreground">
                  Gráficos e métricas de produtividade serão exibidos aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RastreamentoWMS;
