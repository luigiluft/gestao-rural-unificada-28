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
    console.log("useFluxoData - Processing data:", { 
      entradas: entradas.length, 
      estoque: estoque.length, 
      saidas: saidas.length,
      palletsPendentesItems: palletsPendentesItems.length
    });
    
    const produtoMap = new Map<string, FluxoData>();

    // Processar entradas (A Caminho - incluindo produtos ainda não alocados)
    entradas.forEach(entrada => {
      // Produtos em trânsito
      if (entrada.status_aprovacao === 'aguardando_transporte' || 
          entrada.status_aprovacao === 'em_transferencia') {
        entrada.entrada_itens.forEach(item => {
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
        });
      }
    });

    // Processar produtos em pallets pendentes (A Caminho)
    palletsPendentesItems.forEach(item => {
      console.log("Processing pallet pendente item:", item);
      const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
      console.log("Adding pallet pendente to chart - produto:", produtoNome, "quantidade:", item.quantidade);
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
    });

    // Processar estoque (No Depósito - somente produtos já alocados em posições)
    estoque.forEach(item => {
      console.log("Processing estoque item:", item);
      if (item.quantidade_atual > 0) {
        const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
        console.log("Adding to chart - produto:", produtoNome, "quantidade:", item.quantidade_atual);
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
      console.log("Processing saida:", saida);
      saida.saida_itens?.forEach(item => {
        const produtoNome = item.produtos?.nome || `Produto ${item.produto_id.slice(0, 8)}`;
        console.log("Adding saida to chart - produto:", produtoNome, "quantidade:", item.quantidade, "status:", saida.status);
        const current = produtoMap.get(produtoNome) || {
          produto: produtoNome,
          aCaminho: 0,
          noDeposito: 0,
          emSeparacao: 0,
          expedido: 0,
          entregue: 0,
        };

        if (saida.status === 'separacao_pendente' || saida.status === 'separado') {
          current.emSeparacao += item.quantidade;
        } else if (saida.status === 'expedido') {
          current.expedido += item.quantidade;
        } else if (saida.status === 'entregue') {
          current.entregue += item.quantidade;
        }

        produtoMap.set(produtoNome, current);
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
      .sort((a, b) => {
        // Ordenar por quantidade total (maior para menor)
        const totalA = a.aCaminho + a.noDeposito + a.emSeparacao + a.expedido + a.entregue;
        const totalB = b.aCaminho + b.noDeposito + b.emSeparacao + b.expedido + b.entregue;
        return totalB - totalA;
      })
      .slice(0, 20); // Limitar a 20 produtos para melhor visualização
    
    console.log("useFluxoData - Final result:", result);
    return result;
  }, [entradas, estoque, saidas, palletsPendentesItems]);
};