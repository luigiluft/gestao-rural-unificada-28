import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Calculator,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { useTabelasFrete, useDeleteTabelaFrete } from '@/hooks/useTabelasFrete';

const TabelaFrete = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: tabelasFrete = [], isLoading } = useTabelasFrete();
  const deleteTabelaMutation = useDeleteTabelaFrete();
  
  const tabela = tabelasFrete.find(t => t.id === id);

  const tiposBadges = {
    regional: { label: 'Regional', variant: 'default' as const },
    nacional: { label: 'Nacional', variant: 'secondary' as const },
    internacional: { label: 'Internacional', variant: 'outline' as const },
    distancia: { label: 'Distância', variant: 'default' as const },
    peso: { label: 'Peso', variant: 'secondary' as const },
    fixo: { label: 'Fixo', variant: 'outline' as const }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!tabela) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tabelas-frete')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tabela de frete não encontrada.</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta tabela de frete?')) {
      await deleteTabelaMutation.mutateAsync(tabela.id);
      navigate('/tabelas-frete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tabelas-frete')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tabela.nome}</h1>
            <p className="text-muted-foreground">
              Detalhes da tabela de frete
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={deleteTabelaMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações da Tabela */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={tiposBadges[tabela.tipo as keyof typeof tiposBadges]?.variant || 'default'}>
              {tiposBadges[tabela.tipo as keyof typeof tiposBadges]?.label || tabela.tipo}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={tabela.ativo ? 'default' : 'secondary'}>
              {tabela.ativo ? 'Ativa' : 'Inativa'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabela.frete_faixas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Configuradas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Criada em</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(tabela.created_at).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das Faixas de Frete */}
      <Card>
        <CardHeader>
          <CardTitle>Faixas de Frete</CardTitle>
        </CardHeader>
        <CardContent>
          {tabela.frete_faixas && tabela.frete_faixas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distância (km)</TableHead>
                  <TableHead>Até 300 kg (R$/viagem)</TableHead>
                  <TableHead>301–999 kg (R$/kg)</TableHead>
                  <TableHead>Pedágio (R$/ton)</TableHead>
                  <TableHead>Prazo (dias)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabela.frete_faixas.map((faixa) => (
                  <TableRow key={faixa.id}>
                    <TableCell className="font-medium">
                      {faixa.distancia_min}–{faixa.distancia_max}
                    </TableCell>
                    <TableCell>R$ {faixa.valor_ate_300kg.toFixed(2)}</TableCell>
                    <TableCell>R$ {faixa.valor_por_kg_301_999.toFixed(2)}</TableCell>
                    <TableCell>R$ {faixa.pedagio_por_ton.toFixed(2)}</TableCell>
                    <TableCell>D+{faixa.prazo_dias}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma faixa de frete configurada para esta tabela.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaFrete;