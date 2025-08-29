import { useMemo } from 'react';

interface Entrada {
  id: string;
  status_aprovacao: string;
  entrada_itens: Array<{
    produto_id: string;
    quantidade: number;
    produtos?: {
      nome: string;
    };
  }>;
}

interface Estoque {
  produto_id: string;
  quantidade_atual: number;
  produtos?: {
    nome: string;
  };
}

interface Saida {
  id: string;
  status: string;
  saida_itens: Array<{
    produto_id: string;
    quantidade: number;
    produtos?: {
      nome: string;
    };
  }>;
}

interface PalletPendenteItem {
  produto_id: string;
  quantidade: number;
  produtos?: {
    nome: string;
  };
}

interface FluxoData {
  produto: string;
  aCaminho: number;
  noDeposito: number;
  emSeparacao: number;
  expedido: number;
  entregue: number;
}

export const useFluxoData = (
  entradas: Entrada[],
  estoque: Estoque[],
  saidas: Saida[],
  palletsPendentesItems: PalletPendenteItem[] = []
): FluxoData[] => {
  return useMemo(() => {
    if (!entradas || !estoque || !saidas) {
      return []
    }
    
    const produtoMap = new Map<string, FluxoData>();

    // Processar entradas (A Caminho - incluindo produtos ainda não alocados)
    entradas.forEach(entrada => {
      // Produtos em trânsito
      if (entrada?.status_aprovacao === 'aguardando_transporte' || 
          entrada?.status_aprovacao === 'em_transferencia') {
        entrada?.entrada_itens?.forEach(item => {
          if (item?.produto_id && typeof item?.quantidade === 'number') {
            const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
            const current = produtoMap.get(produtoNome) || {
              produto: produtoNome,
              aCaminho: 0,
              noDeposito: 0,
              emSeparacao: 0,
              expedido: 0,
              entregue: 0,
            };
            current.aCaminho += item.quantidade;
            produtoMap.set(produtoNome, current);
          }
        });
      }
    });

    // Processar produtos em pallets pendentes (A Caminho)
    palletsPendentesItems?.forEach(item => {
      if (item?.produto_id && typeof item?.quantidade === 'number') {
        const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
        const current = produtoMap.get(produtoNome) || {
          produto: produtoNome,
          aCaminho: 0,
          noDeposito: 0,
          emSeparacao: 0,
          expedido: 0,
          entregue: 0,
        };
        current.aCaminho += item.quantidade;
        produtoMap.set(produtoNome, current);
      }
    });

    // Processar estoque (No Depósito - somente produtos já alocados em posições)
    estoque.forEach(item => {
      if (item?.quantidade_atual > 0 && item?.produto_id) {
        const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
        const current = produtoMap.get(produtoNome) || {
          produto: produtoNome,
          aCaminho: 0,
          noDeposito: 0,
          emSeparacao: 0,
          expedido: 0,
          entregue: 0,
        };
        current.noDeposito += item.quantidade_atual;
        produtoMap.set(produtoNome, current);
      }
    });

    // Processar saídas
    saidas.forEach(saida => {
      saida?.saida_itens?.forEach(item => {
        if (item?.produto_id && typeof item?.quantidade === 'number') {
          const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
          const current = produtoMap.get(produtoNome) || {
            produto: produtoNome,
            aCaminho: 0,
            noDeposito: 0,
            emSeparacao: 0,
            expedido: 0,
            entregue: 0,
          };

          if (saida?.status === 'separacao_pendente' || saida?.status === 'separado') {
            current.emSeparacao += item.quantidade;
          } else if (saida?.status === 'expedido') {
            current.expedido += item.quantidade;
          } else if (saida?.status === 'entregue') {
            current.entregue += item.quantidade;
          }

          produtoMap.set(produtoNome, current);
        }
      });
    });

    // Converter Map para Array e filtrar produtos com alguma quantidade
    const result = Array.from(produtoMap.values())
      .filter(item => 
        item.aCaminho > 0 || 
        item.noDeposito > 0 || 
        item.emSeparacao > 0 || 
        item.expedido > 0 || 
        item.entregue > 0
      )
      .map(item => ({
        ...item,
        total: item.aCaminho + item.noDeposito + item.emSeparacao + item.expedido + item.entregue
      }))
      .sort((a, b) => b.total - a.total) // Ordenar por quantidade total (maior para menor)
      .slice(0, 20); // Limitar a 20 produtos para melhor visualização
    
    return result;
  }, [entradas, estoque, saidas, palletsPendentesItems]);
};