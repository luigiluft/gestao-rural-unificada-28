import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, MapPin } from "lucide-react";
import { useEstoquePorProdutoFEFO } from "@/hooks/useEstoquePorProdutoFEFO";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PosicoesProdutoProps {
  produtoId: string;
  depositoId: string;
  produtoNome: string;
}

export const PosicoesProduto = ({ produtoId, depositoId, produtoNome }: PosicoesProdutoProps) => {
  const { data: estoqueFEFO, isLoading } = useEstoquePorProdutoFEFO(produtoId, depositoId);

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
  const outrasPositions = estoqueFEFO.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Posições - {produtoNome}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Posição Sugerida (FEFO) */}
        <div className="border-l-4 border-l-primary bg-primary/5 rounded-r-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                SUGERIDO - FEFO
              </Badge>
              {getStatusIcon(sugestaoFEFO.status_validade)}
            </div>
            <Badge variant={getStatusVariant(sugestaoFEFO.status_validade)}>
              {getStatusText(sugestaoFEFO)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Posição:</span>
              <p className="text-lg font-mono">{sugestaoFEFO.posicao_codigo || 'N/A'}</p>
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

        {/* Outras Posições */}
        {outrasPositions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-muted-foreground">Outras posições disponíveis:</h4>
            <div className="space-y-2">
              {outrasPositions.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{item.posicao_codigo || 'N/A'}</span>
                      {getStatusIcon(item.status_validade)}
                    </div>
                    <Badge variant={getStatusVariant(item.status_validade)}>
                      {getStatusText(item)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span>Qtd: </span>
                      <span className="font-medium">{item.quantidade_atual}</span>
                    </div>
                    <div>
                      <span>Lote: </span>
                      <span className="font-mono">{item.lote || 'N/A'}</span>
                    </div>
                    <div>
                      <span>Val: </span>
                      <span>
                        {item.data_validade 
                          ? format(new Date(item.data_validade), "dd/MM/yy", { locale: ptBR })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};