import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Undo2
} from 'lucide-react';
import { useOcorrencias, useCreateOcorrencia, useUpdateOcorrencia } from '@/hooks/useOcorrencias';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useUpdateNotificationView } from '@/hooks/useNotificationViews';
import { DevolucaoDialog } from '@/components/Ocorrencias/DevolucaoDialog';
import { useViagens } from '@/hooks/useViagens';
import { useSaidas } from '@/hooks/useSaidas';

const Ocorrencias = () => {
  const updateNotificationView = useUpdateNotificationView();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [devolucaoDialogOpen, setDevolucaoDialogOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any>(null);
  
  // Form states
  const [formTipo, setFormTipo] = useState('');
  const [formPrioridade, setFormPrioridade] = useState('');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formViagemId, setFormViagemId] = useState('');
  const [formSaidaId, setFormSaidaId] = useState('');
  const [formLocalizacao, setFormLocalizacao] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  
  const createOcorrencia = useCreateOcorrencia();
  const updateOcorrencia = useUpdateOcorrencia();
  const { data: viagens = [] } = useViagens();
  const { data: saidas = [] } = useSaidas();

  // Mark as viewed when component mounts
  useEffect(() => {
    updateNotificationView.mutate("ocorrencias");
  }, []);

  const { data: ocorrencias = [], isLoading, error } = useOcorrencias({ 
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tipo: tipoFilter !== 'all' ? tipoFilter : undefined
  });
  
  const handleCreateOcorrencia = () => {
    if (!formTipo || !formPrioridade || !formTitulo || !formDescricao) {
      return;
    }

    createOcorrencia.mutate({
      tipo: formTipo,
      prioridade: formPrioridade,
      titulo: formTitulo,
      descricao: formDescricao,
      viagem_id: formViagemId || undefined,
      saida_id: formSaidaId || undefined,
      localizacao: formLocalizacao || undefined,
      observacoes: formObservacoes || undefined
    }, {
      onSuccess: () => {
        // Reset form
        setFormTipo('');
        setFormPrioridade('');
        setFormTitulo('');
        setFormDescricao('');
        setFormViagemId('');
        setFormSaidaId('');
        setFormLocalizacao('');
        setFormObservacoes('');
        setDialogOpen(false);
      }
    });
  };
  
  const handleUpdateStatus = (id: string, newStatus: string) => {
    updateOcorrencia.mutate({ id, status: newStatus });
  };

  const handleSolicitarDevolucao = (ocorrencia: any) => {
    setSelectedOcorrencia(ocorrencia)
    setDevolucaoDialogOpen(true)
  }

  const displayOcorrencias = ocorrencias;

  const statusBadges = {
    aberta: { label: 'Aberta', variant: 'destructive' as const, icon: XCircle },
    em_andamento: { label: 'Em Andamento', variant: 'default' as const, icon: Clock },
    resolvida: { label: 'Resolvida', variant: 'outline' as const, icon: CheckCircle },
    cancelada: { label: 'Cancelada', variant: 'secondary' as const, icon: XCircle }
  };

  const tipoBadges = {
    acidente: { label: 'Acidente', variant: 'destructive' as const },
    avaria: { label: 'Avaria', variant: 'default' as const },
    atraso: { label: 'Atraso', variant: 'secondary' as const },
    roubo: { label: 'Roubo', variant: 'destructive' as const },
    outros: { label: 'Outros', variant: 'outline' as const }
  };

  const prioridadeBadges = {
    alta: { label: 'Alta', variant: 'destructive' as const },
    media: { label: 'Média', variant: 'default' as const },
    baixa: { label: 'Baixa', variant: 'secondary' as const }
  };

  const filteredOcorrencias = displayOcorrencias.filter(ocorrencia => {
    const matchesSearch = ocorrencia.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ocorrencia.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ocorrencia.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div>Erro ao carregar ocorrências: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ocorrências</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe ocorrências durante as viagens
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Ocorrência *</Label>
                  <Select value={formTipo} onValueChange={setFormTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acidente">Acidente</SelectItem>
                      <SelectItem value="avaria">Avaria</SelectItem>
                      <SelectItem value="atraso">Atraso</SelectItem>
                      <SelectItem value="roubo">Roubo</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade *</Label>
                  <Select value={formPrioridade} onValueChange={setFormPrioridade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input 
                  id="titulo" 
                  placeholder="Título da ocorrência" 
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Descreva detalhadamente a ocorrência" 
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="viagem">Viagem (opcional)</Label>
                  <Select value={formViagemId} onValueChange={setFormViagemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a viagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {viagens.map((viagem) => (
                        <SelectItem key={viagem.id} value={viagem.id}>
                          Viagem #{viagem.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saida">Saída (opcional)</Label>
                  <Select value={formSaidaId} onValueChange={setFormSaidaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a saída" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {saidas.map((saida) => (
                        <SelectItem key={saida.id} value={saida.id}>
                          Saída #{saida.numero_saida}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização (opcional)</Label>
                <Input 
                  id="localizacao" 
                  placeholder="Local onde ocorreu o problema" 
                  value={formLocalizacao}
                  onChange={(e) => setFormLocalizacao(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Observações adicionais" 
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleCreateOcorrencia}
                  disabled={!formTipo || !formPrioridade || !formTitulo || !formDescricao || createOcorrencia.isPending}
                >
                  {createOcorrencia.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por número, título ou motorista..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="acidente">Acidente</SelectItem>
            <SelectItem value="avaria">Avaria</SelectItem>
            <SelectItem value="atraso">Atraso</SelectItem>
            <SelectItem value="roubo">Roubo</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="resolvida">Resolvida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayOcorrencias.filter(o => o.status === 'aberta').length}
            </div>
            <p className="text-xs text-muted-foreground">Necessitam atenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayOcorrencias.filter(o => o.status === 'em_andamento').length}
            </div>
            <p className="text-xs text-muted-foreground">Sendo resolvidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayOcorrencias.filter(o => o.status === 'resolvida').length}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ocorrências */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ocorrências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOcorrencias.length === 0 ? (
              <EmptyState 
                title="Nenhuma ocorrência encontrada"
                description="Quando houver ocorrências registradas, elas aparecerão aqui"
              />
            ) : (
              filteredOcorrencias.map((ocorrencia) => (
              <Card key={ocorrencia.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{ocorrencia.numero}</h3>
                          <Badge variant={tipoBadges[ocorrencia.tipo as keyof typeof tipoBadges]?.variant || 'outline'}>
                            {tipoBadges[ocorrencia.tipo as keyof typeof tipoBadges]?.label || ocorrencia.tipo}
                          </Badge>
                          <Badge variant={prioridadeBadges[ocorrencia.prioridade as keyof typeof prioridadeBadges]?.variant || 'secondary'}>
                            {prioridadeBadges[ocorrencia.prioridade as keyof typeof prioridadeBadges]?.label || ocorrencia.prioridade}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-medium">{ocorrencia.titulo}</h4>
                    </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadges[ocorrencia.status as keyof typeof statusBadges]?.variant || 'secondary'}>
                            {statusBadges[ocorrencia.status as keyof typeof statusBadges] && 
                              React.createElement(statusBadges[ocorrencia.status as keyof typeof statusBadges].icon, { className: "h-3 w-3 mr-1" })
                            }
                            {statusBadges[ocorrencia.status as keyof typeof statusBadges]?.label || ocorrencia.status}
                          </Badge>
                        </div>
                  </div>
                  
                      <p className="text-sm text-muted-foreground mb-4">{ocorrencia.descricao}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{ocorrencia.localizacao || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{ocorrencia.created_at ? new Date(ocorrencia.created_at).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                  
                      {ocorrencia.observacoes && (
                        <div className="mt-4 p-3 bg-muted rounded text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Observações:</span>
                          </div>
                          <p>{ocorrencia.observacoes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Criado por: {ocorrencia.criado_por || 'Sistema'}
                        </div>
                        <div className="flex gap-2">
                          {ocorrencia.status === 'aberta' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateStatus(ocorrencia.id, 'em_andamento')}
                              >
                                Iniciar Resolução
                              </Button>
                              {ocorrencia.viagem_id && !ocorrencia.requer_devolucao && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSolicitarDevolucao(ocorrencia)}
                                >
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Solicitar Devolução
                                </Button>
                              )}
                            </>
                          )}
                          {ocorrencia.status === 'em_andamento' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateStatus(ocorrencia.id, 'resolvida')}
                              >
                                Marcar como Resolvida
                              </Button>
                              {ocorrencia.viagem_id && !ocorrencia.requer_devolucao && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSolicitarDevolucao(ocorrencia)}
                                >
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Solicitar Devolução
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* Mostrar status de devolução se já foi solicitada */}
                          {ocorrencia.requer_devolucao && ocorrencia.devolucao_id && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                <Undo2 className="h-4 w-4" />
                                <span className="font-medium">Devolução em andamento</span>
                              </div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Entrada: {ocorrencia.devolucao_id.substring(0, 8)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Devolução */}
      {selectedOcorrencia && (
        <DevolucaoDialog
          open={devolucaoDialogOpen}
          onOpenChange={setDevolucaoDialogOpen}
          ocorrenciaId={selectedOcorrencia.id}
          saidaId={selectedOcorrencia.saida_id}
          viagemId={selectedOcorrencia.viagem_id}
        />
      )}
    </div>
  );
};

export default Ocorrencias;