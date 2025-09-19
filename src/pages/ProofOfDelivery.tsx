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
  Plus,
  Eye,
  Download,
  MapPin,
  Clock,
  User
} from 'lucide-react';

const ProofOfDelivery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data para comprovantes de entrega
  const comprovantes = [
    {
      id: '1',
      codigo: 'POD-001',
      cliente: 'João Silva',
      endereco: 'Rua das Flores, 123 - São Paulo, SP',
      data_entrega: '2024-01-15 14:30',
      recebido_por: 'Maria Silva',
      documento_recebedor: '123.456.789-00',
      status: 'confirmado',
      tem_assinatura: true,
      total_fotos: 3,
      observacoes: 'Entrega realizada no portão principal'
    },
    {
      id: '2',
      codigo: 'POD-002',
      cliente: 'Maria Santos',
      endereco: 'Av. Principal, 456 - Rio de Janeiro, RJ',
      data_entrega: '2024-01-15 16:45',
      recebido_por: 'Carlos Santos',
      documento_recebedor: '987.654.321-00',
      status: 'pendente',
      tem_assinatura: false,
      total_fotos: 1,
      observacoes: 'Aguardando confirmação do recebedor'
    },
    {
      id: '3',
      codigo: 'POD-003',
      cliente: 'Pedro Oliveira',
      endereco: 'Rua do Campo, 789 - Belo Horizonte, MG',
      data_entrega: '2024-01-14 11:20',
      recebido_por: 'Ana Oliveira',
      documento_recebedor: '456.789.123-00',
      status: 'confirmado',
      tem_assinatura: true,
      total_fotos: 5,
      observacoes: 'Entrega conferida e aprovada'
    }
  ];

  const statusBadges = {
    pendente: { label: 'Pendente', variant: 'secondary' as const },
    confirmado: { label: 'Confirmado', variant: 'default' as const },
    rejeitado: { label: 'Rejeitado', variant: 'destructive' as const }
  };

  const filteredComprovantes = comprovantes.filter(comprovante => {
    const matchesSearch = comprovante.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comprovante.recebido_por.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comprovante.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proof of Delivery</h1>
          <p className="text-muted-foreground">
            Gerencie comprovantes de entrega e assinaturas digitais
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Comprovante
        </Button>
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
              {filteredComprovantes.map((comprovante) => (
                <TableRow key={comprovante.id}>
                  <TableCell className="font-medium">{comprovante.codigo}</TableCell>
                  <TableCell>{comprovante.cliente}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{comprovante.recebido_por}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Doc: {comprovante.documento_recebedor}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">
                        {new Date(comprovante.data_entrega).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadges[comprovante.status as keyof typeof statusBadges].variant}>
                      {statusBadges[comprovante.status as keyof typeof statusBadges].label}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalhes Expandidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Signature className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Assinatura Digital</h4>
                <p className="text-sm text-muted-foreground">
                  Capture assinaturas digitais dos recebedores
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Camera className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Fotos de Entrega</h4>
                <p className="text-sm text-muted-foreground">
                  Documente entregas com fotos georreferenciadas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <MapPin className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Geolocalização</h4>
                <p className="text-sm text-muted-foreground">
                  Registre a localização exata da entrega
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Relatório de Entregas Diário
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Exportar Comprovantes PDF
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Relatório de Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProofOfDelivery;