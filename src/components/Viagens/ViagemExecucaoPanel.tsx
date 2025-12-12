import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Plus,
  Truck,
  Package,
  User,
  Navigation,
  FileText,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUpdateViagemData } from '@/hooks/useUpdateViagemData';
import { Viagem } from '@/hooks/useViagens';
import { toast } from 'sonner';

interface Parada {
  id: string;
  tipo: 'COLETA' | 'ENTREGA' | 'PARADA_TECNICA';
  ordem: number;
  local: string;
  endereco: string;
  previsao_chegada: string | null;
  chegada_real: string | null;
  saida_real: string | null;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PULADA';
  observacoes: string | null;
}

interface POD {
  entrega_id: string;
  recebedor_nome: string | null;
  recebedor_documento: string | null;
  assinatura_url: string | null;
  fotos_urls: string[];
  data_entrega: string | null;
  observacoes: string | null;
}

interface Ocorrencia {
  id: string;
  tipo: 'ATRASO' | 'AVARIA' | 'DEVOLUCAO' | 'EXTRAVIO' | 'OUTROS';
  descricao: string;
  data_hora: string;
  resolvida: boolean;
  resolucao: string | null;
}

interface ViagemExecucaoPanelProps {
  viagem: Viagem;
  onUpdate?: () => void;
}

export const ViagemExecucaoPanel = ({ viagem, onUpdate }: ViagemExecucaoPanelProps) => {
  const updateViagem = useUpdateViagemData();
  
  const [novaOcorrenciaOpen, setNovaOcorrenciaOpen] = useState(false);
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    tipo: 'OUTROS' as Ocorrencia['tipo'],
    descricao: '',
  });

  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [podData, setPodData] = useState({
    recebedor_nome: '',
    recebedor_documento: '',
    observacoes: '',
  });
  const [paradaSelecionada, setParadaSelecionada] = useState<string | null>(null);

  // Parse dos dados JSONB
  const paradas: Parada[] = (viagem.paradas as unknown as Parada[]) || [];
  const podRaw = viagem.pod as unknown as POD | null;
  const pod: POD | null = podRaw && podRaw.entrega_id ? podRaw : null;
  const ocorrencias: Ocorrencia[] = (viagem.ocorrencias_viagem as unknown as Ocorrencia[]) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA': return 'bg-green-500';
      case 'EM_ANDAMENTO': return 'bg-blue-500';
      case 'PULADA': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONCLUIDA': return 'Concluída';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'PULADA': return 'Pulada';
      default: return 'Pendente';
    }
  };

  const getTipoParadaLabel = (tipo: string) => {
    switch (tipo) {
      case 'COLETA': return 'Coleta';
      case 'ENTREGA': return 'Entrega';
      case 'PARADA_TECNICA': return 'Parada Técnica';
      default: return tipo;
    }
  };

  const handleIniciarParada = async (paradaId: string) => {
    const novasParadas = paradas.map(p => 
      p.id === paradaId 
        ? { ...p, status: 'EM_ANDAMENTO' as const, chegada_real: new Date().toISOString() }
        : p
    );

    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        paradas: novasParadas as unknown as Record<string, unknown>[],
      });
      toast.success('Parada iniciada!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao iniciar parada:', error);
    }
  };

  const handleConcluirParada = async (paradaId: string) => {
    const novasParadas = paradas.map(p => 
      p.id === paradaId 
        ? { ...p, status: 'CONCLUIDA' as const, saida_real: new Date().toISOString() }
        : p
    );

    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        paradas: novasParadas as unknown as Record<string, unknown>[],
      });
      toast.success('Parada concluída!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao concluir parada:', error);
    }
  };

  const handleRegistrarPOD = async () => {
    const novoPod: POD = {
      entrega_id: paradaSelecionada || viagem.id,
      recebedor_nome: podData.recebedor_nome,
      recebedor_documento: podData.recebedor_documento,
      assinatura_url: null,
      fotos_urls: [],
      data_entrega: new Date().toISOString(),
      observacoes: podData.observacoes,
    };

    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        pod: novoPod as unknown as Record<string, unknown>,
      });
      toast.success('Comprovante de entrega registrado!');
      setPodDialogOpen(false);
      setPodData({ recebedor_nome: '', recebedor_documento: '', observacoes: '' });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao registrar POD:', error);
    }
  };

  const handleAdicionarOcorrencia = async () => {
    if (!novaOcorrencia.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    const novaOcorrenciaObj: Ocorrencia = {
      id: crypto.randomUUID(),
      tipo: novaOcorrencia.tipo,
      descricao: novaOcorrencia.descricao,
      data_hora: new Date().toISOString(),
      resolvida: false,
      resolucao: null,
    };

    const novasOcorrencias = [...ocorrencias, novaOcorrenciaObj];

    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        ocorrencias_viagem: novasOcorrencias as unknown as Record<string, unknown>[],
      });
      toast.success('Ocorrência registrada!');
      setNovaOcorrenciaOpen(false);
      setNovaOcorrencia({ tipo: 'OUTROS', descricao: '' });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
    }
  };

  const handleResolverOcorrencia = async (ocorrenciaId: string, resolucao: string) => {
    const novasOcorrencias = ocorrencias.map(o =>
      o.id === ocorrenciaId
        ? { ...o, resolvida: true, resolucao }
        : o
    );

    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        ocorrencias_viagem: novasOcorrencias as unknown as Record<string, unknown>[],
      });
      toast.success('Ocorrência resolvida!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao resolver ocorrência:', error);
    }
  };

  const handleIniciarViagem = async () => {
    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        status: 'em_andamento',
        data_inicio: new Date().toISOString(),
      });
      toast.success('Viagem iniciada!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao iniciar viagem:', error);
    }
  };

  const handleFinalizarViagem = async () => {
    try {
      await updateViagem.mutateAsync({
        id: viagem.id,
        status: 'entregue',
        data_fim: new Date().toISOString(),
      });
      toast.success('Viagem finalizada!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao finalizar viagem:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Status e Ações Principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Viagem {viagem.numero}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tipo: {viagem.tipo_execucao || 'Não definido'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={viagem.status === 'em_andamento' ? 'default' : 'secondary'}>
                {viagem.status === 'planejada' && 'Planejada'}
                {viagem.status === 'em_andamento' && 'Em Andamento'}
                {viagem.status === 'entregue' && 'Entregue'}
                {viagem.status === 'cancelada' && 'Cancelada'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {viagem.status === 'planejada' && (
              <Button onClick={handleIniciarViagem} className="gap-2">
                <Navigation className="h-4 w-4" />
                Iniciar Viagem
              </Button>
            )}
            {viagem.status === 'em_andamento' && (
              <>
                <Button onClick={handleFinalizarViagem} variant="outline" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar Viagem
                </Button>
                <Dialog open={podDialogOpen} onOpenChange={setPodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Camera className="h-4 w-4" />
                      Registrar POD
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Comprovante de Entrega (POD)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome do Recebedor</label>
                        <Input
                          value={podData.recebedor_nome}
                          onChange={(e) => setPodData({ ...podData, recebedor_nome: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Documento</label>
                        <Input
                          value={podData.recebedor_documento}
                          onChange={(e) => setPodData({ ...podData, recebedor_documento: e.target.value })}
                          placeholder="CPF ou RG"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Observações</label>
                        <Textarea
                          value={podData.observacoes}
                          onChange={(e) => setPodData({ ...podData, observacoes: e.target.value })}
                          placeholder="Observações sobre a entrega..."
                        />
                      </div>
                      <Button onClick={handleRegistrarPOD} className="w-full">
                        Registrar Comprovante
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={novaOcorrenciaOpen} onOpenChange={setNovaOcorrenciaOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Registrar Ocorrência
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Ocorrência</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Tipo</label>
                        <Select 
                          value={novaOcorrencia.tipo} 
                          onValueChange={(v) => setNovaOcorrencia({ ...novaOcorrencia, tipo: v as Ocorrencia['tipo'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATRASO">Atraso</SelectItem>
                            <SelectItem value="AVARIA">Avaria</SelectItem>
                            <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                            <SelectItem value="EXTRAVIO">Extravio</SelectItem>
                            <SelectItem value="OUTROS">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea
                          value={novaOcorrencia.descricao}
                          onChange={(e) => setNovaOcorrencia({ ...novaOcorrencia, descricao: e.target.value })}
                          placeholder="Descreva a ocorrência..."
                        />
                      </div>
                      <Button onClick={handleAdicionarOcorrencia} className="w-full">
                        Registrar Ocorrência
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Paradas */}
      {paradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Roteiro de Paradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paradas.sort((a, b) => a.ordem - b.ordem).map((parada, index) => (
                <div key={parada.id} className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(parada.status)}`} />
                    {index < paradas.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  
                  {/* Parada content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getTipoParadaLabel(parada.tipo)}</Badge>
                          <span className="font-medium">{parada.local}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{parada.endereco}</p>
                        {parada.previsao_chegada && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Previsão: {format(new Date(parada.previsao_chegada), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                        )}
                        {parada.chegada_real && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Chegada: {format(new Date(parada.chegada_real), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={parada.status === 'CONCLUIDA' ? 'default' : 'secondary'}>
                          {getStatusLabel(parada.status)}
                        </Badge>
                        {parada.status === 'PENDENTE' && viagem.status === 'em_andamento' && (
                          <Button size="sm" onClick={() => handleIniciarParada(parada.id)}>
                            Iniciar
                          </Button>
                        )}
                        {parada.status === 'EM_ANDAMENTO' && (
                          <Button size="sm" onClick={() => handleConcluirParada(parada.id)}>
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* POD Registrado */}
      {pod?.data_entrega && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprovante de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Recebedor</p>
                <p className="font-medium">{pod?.recebedor_nome || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documento</p>
                <p className="font-medium">{pod?.recebedor_documento || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">
                  {format(new Date(pod.data_entrega), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              {pod?.observacoes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{pod.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ocorrências */}
      {ocorrencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ocorrências ({ocorrencias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ocorrencias.map((ocorrencia) => (
                <div 
                  key={ocorrencia.id} 
                  className={`p-3 rounded-lg border ${ocorrencia.resolvida ? 'bg-muted/50' : 'bg-destructive/10 border-destructive/30'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ocorrencia.resolvida ? 'secondary' : 'destructive'}>
                          {ocorrencia.tipo}
                        </Badge>
                        {ocorrencia.resolvida && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Resolvida
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1">{ocorrencia.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(ocorrencia.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {ocorrencia.resolucao && (
                        <p className="text-sm text-green-600 mt-2">
                          <strong>Resolução:</strong> {ocorrencia.resolucao}
                        </p>
                      )}
                    </div>
                    {!ocorrencia.resolvida && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const resolucao = prompt('Descreva a resolução:');
                          if (resolucao) {
                            handleResolverOcorrencia(ocorrencia.id, resolucao);
                          }
                        }}
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
