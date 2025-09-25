import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  FileText, 
  Camera, 
  Signature, 
  Eye,
  Download,
  Clock,
  User
} from 'lucide-react';
import { useComprovantesEntrega } from '@/hooks/useComprovantesEntrega';
import { LoadingState } from '@/components/ui/loading-state';

const Comprovantes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: comprovantes = [], isLoading, error } = useComprovantesEntrega({ status: statusFilter !== 'all' ? statusFilter : undefined });

  const statusBadges = {
    pendente: { label: 'Pendente', variant: 'secondary' as const },
    confirmado: { label: 'Confirmado', variant: 'default' as const },
    rejeitado: { label: 'Rejeitado', variant: 'destructive' as const }
  };

  const filteredComprovantes = comprovantes.filter(comprovante => {
    const matchesSearch = comprovante.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.recebido_por?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div>Erro ao carregar comprovantes: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comprovantes de Entrega</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os comprovantes de entrega
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por código, cliente ou recebedor..."
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
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comprovantes.filter(c => c.status === 'confirmado').length}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Assinatura</CardTitle>
            <Signature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comprovantes.filter(c => c.tem_assinatura).length}
            </div>
            <p className="text-xs text-muted-foreground">Assinadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Fotos</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comprovantes.filter(c => c.total_fotos > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Fotografadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fotos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comprovantes.reduce((acc, c) => acc + c.total_fotos, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Arquivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comprovantes */}
      <Card>
        <CardHeader>
          <CardTitle>Comprovantes de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Recebido Por</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Anexos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
                <TableBody>
                  {filteredComprovantes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum comprovante encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComprovantes.map((comprovante) => (
                      <TableRow key={comprovante.id}>
                        <TableCell className="font-medium">{comprovante.codigo}</TableCell>
                        <TableCell>{comprovante.cliente_nome}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="text-sm">{comprovante.recebido_por || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Doc: {comprovante.documento_recebedor || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm">
                              {comprovante.data_entrega ? new Date(comprovante.data_entrega).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadges[comprovante.status as keyof typeof statusBadges]?.variant || 'secondary'}>
                            {statusBadges[comprovante.status as keyof typeof statusBadges]?.label || comprovante.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Signature className="h-3 w-3" />
                              <span className={comprovante.tem_assinatura ? "text-green-600" : "text-gray-400"}>
                                {comprovante.tem_assinatura ? "Sim" : "Não"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              <span>{comprovante.total_fotos}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
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
    </div>
  );
};

export default Comprovantes;