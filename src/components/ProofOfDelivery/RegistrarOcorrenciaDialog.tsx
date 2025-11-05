import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { useCreateOcorrencia } from '@/hooks/useOcorrencias';

interface RegistrarOcorrenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viagemId: string;
  veiculoId?: string;
  motoristaId?: string;
}

export const RegistrarOcorrenciaDialog: React.FC<RegistrarOcorrenciaDialogProps> = ({
  open,
  onOpenChange,
  viagemId,
  veiculoId,
  motoristaId
}) => {
  const [tipo, setTipo] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('media');
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [localizacao, setLocalizacao] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');

  const createOcorrencia = useCreateOcorrencia();

  const handleSubmit = () => {
    if (!tipo || !titulo || !descricao) {
      return;
    }

    createOcorrencia.mutate({
      tipo,
      prioridade,
      titulo,
      descricao,
      viagem_id: viagemId,
      veiculo_id: veiculoId,
      motorista_id: motoristaId,
      localizacao,
      observacoes
    }, {
      onSuccess: () => {
        // Resetar formulário
        setTipo('');
        setPrioridade('media');
        setTitulo('');
        setDescricao('');
        setLocalizacao('');
        setObservacoes('');
        onOpenChange(false);
      }
    });
  };

  const isValid = tipo && titulo && descricao;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reportar Problema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Problema *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acidente">Acidente</SelectItem>
                  <SelectItem value="avaria">Avaria na Carga</SelectItem>
                  <SelectItem value="atraso">Atraso</SelectItem>
                  <SelectItem value="roubo">Roubo</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
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
              placeholder="Ex: Avaria no pallet 3"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Problema *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o que aconteceu..."
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização (opcional)</Label>
            <Input
              id="localizacao"
              placeholder="Ex: Rodovia BR-101, Km 45"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || createOcorrencia.isPending}
              className="flex-1"
            >
              {createOcorrencia.isPending ? 'Enviando...' : 'Reportar Problema'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
