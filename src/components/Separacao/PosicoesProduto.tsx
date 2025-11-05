import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, MapPin, Info } from "lucide-react";
import { useEstoquePorProdutoFEFO } from "@/hooks/useEstoquePorProdutoFEFO";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PosicoesProdutoProps {
  produtoId: string;
  depositoId: string;
  produtoNome: string;
}

export const PosicoesProduto = ({ produtoId, depositoId, produtoNome }: PosicoesProdutoProps) => {
  const { data: estoqueFEFO, isLoading } = useEstoquePorProdutoFEFO(produtoId, depositoId);
  const { data: configuracoes = [] } = useConfiguracoesSistema();
  const metodoSelecaoConfig = configuracoes.find(c => c.chave === "metodo_selecao_estoque");
  const metodoSelecao = (metodoSelecaoConfig?.valor as 'fefo' | 'fifo' | 'lifo') || 'fefo';

  const getMetodoLabel = () => {
    switch (metodoSelecao) {
      case 'fefo':
        return 'FEFO (Primeiro que vence)';
      case 'fifo':
        return 'FIFO (Primeiro que entrou)';
      case 'lifo':
        return 'LIFO (Último que entrou)';
    }
  };

  const getMetodoDescricao = () => {
    switch (metodoSelecao) {
      case 'fefo':
        return 'Priorizando produtos mais próximos do vencimento';
      case 'fifo':
        return 'Priorizando produtos que entraram primeiro';
      case 'lifo':
        return 'Priorizando produtos que entraram por último';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Posições do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando posições...</p>
        </CardContent>
      </Card>
    );
  }

  if (!estoqueFEFO || estoqueFEFO.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Posições do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum estoque encontrado para este produto.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critico':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'atencao':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'critico':
        return 'destructive' as const;
      case 'atencao':
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  const getStatusText = (item: any) => {
    if (item.dias_para_vencer !== undefined) {
      if (item.dias_para_vencer <= 0) return 'VENCIDO';
      if (item.dias_para_vencer <= 15) return `${item.dias_para_vencer} dias`;
      if (item.dias_para_vencer <= 30) return `${item.dias_para_vencer} dias`;
      return `${item.dias_para_vencer} dias`;
    }
    return 'Sem validade';
  };

  // Primeiro item é a sugestão FEFO
  const sugestaoFEFO = estoqueFEFO[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Posições - {produtoNome}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta de método de seleção */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Método de seleção:</strong> {getMetodoLabel()} - {getMetodoDescricao()}
          </AlertDescription>
        </Alert>

        {/* Posição Sugerida */}
        <div className="border-l-4 border-l-primary bg-primary/5 rounded-r-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                SUGERIDO - {metodoSelecao.toUpperCase()}
              </Badge>
              {getStatusIcon(sugestaoFEFO.status_validade)}
            </div>
            <Badge variant={getStatusVariant(sugestaoFEFO.status_validade)}>
              {getStatusText(sugestaoFEFO)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Posições:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sugestaoFEFO.posicoes.map((pos, index) => (
                  <span key={index} className="text-sm font-mono bg-background px-2 py-1 rounded">
                    {pos.codigo}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium">Quantidade:</span>
              <p>{sugestaoFEFO.quantidade_atual}</p>
            </div>
            <div>
              <span className="font-medium">Lote:</span>
              <p className="font-mono">{sugestaoFEFO.lote || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Validade:</span>
              <p>
                {sugestaoFEFO.data_validade 
                  ? format(new Date(sugestaoFEFO.data_validade), "dd/MM/yyyy", { locale: ptBR })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};