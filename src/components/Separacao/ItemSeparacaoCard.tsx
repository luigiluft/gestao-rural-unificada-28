import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useEstoquePorProdutoFEFO } from "@/hooks/useEstoquePorProdutoFEFO";

interface ItemSeparacaoCardProps {
  item: any;
  depositoId: string;
  formatCurrency: (value: number) => string;
}

export const ItemSeparacaoCard = ({ item, depositoId, formatCurrency }: ItemSeparacaoCardProps) => {
  const { data: estoqueFEFO } = useEstoquePorProdutoFEFO(item.produto_id, depositoId);
  
  // Verificar se há produtos próximos do vencimento
  const hasLotesCriticos = estoqueFEFO?.some(lote => lote.status_validade === 'critico');
  const hasLotesAtencao = estoqueFEFO?.some(lote => lote.status_validade === 'atencao');
  
  const getAlertIcon = () => {
    if (hasLotesCriticos) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (hasLotesAtencao) return <Clock className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  const getAlertBadge = () => {
    if (hasLotesCriticos) {
      return <Badge variant="destructive" className="text-xs">VENCIMENTO CRÍTICO</Badge>;
    }
    if (hasLotesAtencao) {
      return <Badge variant="secondary" className="text-xs">ATENÇÃO VENCIMENTO</Badge>;
    }
    return null;
  };

  const posicaoSugerida = estoqueFEFO?.[0]?.posicoes?.[0]?.codigo;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="font-medium">{item.produtos?.nome}</p>
        {getAlertIcon()}
      </div>
      <div className="flex items-center gap-2">
        {posicaoSugerida && (
          <Badge variant="outline" className="text-xs font-mono">
            {posicaoSugerida}
          </Badge>
        )}
        {getAlertBadge()}
      </div>
    </div>
  );
};