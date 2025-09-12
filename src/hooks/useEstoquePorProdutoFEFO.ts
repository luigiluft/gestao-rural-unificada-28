import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstoqueFEFO {
  id: string;
  produto_id: string;
  produto_nome: string;
  deposito_id: string;
  quantidade_atual: number;
  lote?: string;
  data_validade?: string;
  data_entrada: string;
  posicoes: Array<{
    codigo: string;
    posicao_id?: string;
    quantidade: number;
  }>;
  dias_para_vencer?: number;
  prioridade_fefo: number;
  status_validade: 'critico' | 'atencao' | 'normal';
  pallet_id?: string;
  pallet_numero?: number;
}

export const useEstoquePorProdutoFEFO = (produtoId?: string, depositoId?: string, produtorDestinatarioId?: string) => {
  return useQuery({
    queryKey: ["estoque-fefo", produtoId, depositoId, produtorDestinatarioId],
    queryFn: async () => {
      if (!produtoId || !depositoId) return [];

      console.log('🔍 Buscando estoque FEFO para produto:', produtoId, 'depósito:', depositoId);
      
      const estoqueFEFO: EstoqueFEFO[] = [];

      // 1. Buscar produtos que vieram de pallets alocados
      const { data: palletsData, error: palletsError } = await supabase
        .from("entrada_pallets")
        .select(`
          id,
          numero_pallet,
          descricao,
          entrada_id,
          created_at,
          entradas!inner(
            id,
            deposito_id,
            data_entrada,
            user_id
          ),
          entrada_pallet_itens!inner(
            id,
            quantidade,
            entrada_itens!inner(
              id,
              produto_id,
              nome_produto,
              lote,
              data_validade,
              valor_unitario
            )
          ),
          pallet_positions!inner(
            id,
            posicao_id,
            alocado_em,
            status,
            storage_positions!inner(
              id,
              codigo,
              ocupado
            )
          )
        `)
        .eq("entradas.deposito_id", depositoId)
        .eq("entrada_pallet_itens.entrada_itens.produto_id", produtoId)
        .eq("pallet_positions.status", "alocado");

      if (palletsError) {
        console.error('❌ Erro ao buscar pallets:', palletsError);
      } else if (palletsData && palletsData.length > 0) {
        // Agrupar por lote e processar posições
        const loteGroups = new Map();
        
        palletsData.forEach((pallet) => {
          pallet.entrada_pallet_itens
            .filter(item => item.entrada_itens.produto_id === produtoId)
            .forEach((item) => {
              const entrada = pallet.entradas;
              const entradaItem = item.entrada_itens;
              const loteKey = entradaItem.lote || `P${pallet.numero_pallet}-${entrada.id.substring(0, 8)}`;
              
              if (!loteGroups.has(loteKey)) {
                // Calcular dias para vencer
                const dataValidade = entradaItem.data_validade ? new Date(entradaItem.data_validade) : null;
                const hoje = new Date();
                const diasParaVencer = dataValidade ? 
                  Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : 
                  999;
                
                let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
                if (diasParaVencer <= 15) {
                  statusValidade = 'critico';
                } else if (diasParaVencer <= 30) {
                  statusValidade = 'atencao';
                }

                loteGroups.set(loteKey, {
                  id: `lote-${loteKey}-${entradaItem.produto_id}`,
                  produto_id: entradaItem.produto_id,
                  produto_nome: entradaItem.nome_produto,
                  deposito_id: entrada.deposito_id,
                  quantidade_atual: 0,
                  lote: loteKey,
                  data_validade: entradaItem.data_validade,
                  data_entrada: entrada.data_entrada,
                  posicoes: [],
                  dias_para_vencer: diasParaVencer,
                  prioridade_fefo: calcularPrioridadeFEFO(entradaItem.data_validade, entrada.data_entrada),
                  status_validade: statusValidade,
                  pallet_id: pallet.id,
                  pallet_numero: pallet.numero_pallet
                });
              }
              
              const loteData = loteGroups.get(loteKey);
              loteData.quantidade_atual += item.quantidade;
              
              // Adicionar posições do pallet
              if (Array.isArray(pallet.pallet_positions)) {
                pallet.pallet_positions.forEach(position => {
                  const posicaoCodigo = position?.storage_positions?.codigo || 'SEM POSIÇÃO';
                  loteData.posicoes.push({
                    codigo: posicaoCodigo,
                    posicao_id: position?.posicao_id,
                    quantidade: item.quantidade
                  });
                });
              } else if (pallet.pallet_positions) {
                // Caso seja um objeto único ao invés de array
                const position = pallet.pallet_positions;
                const posicaoCodigo = position?.storage_positions?.codigo || 'SEM POSIÇÃO';
                loteData.posicoes.push({
                  codigo: posicaoCodigo,
                  posicao_id: position?.posicao_id,
                  quantidade: item.quantidade
                });
              }
            });
        });
        
        estoqueFEFO.push(...Array.from(loteGroups.values()));
      }

      // 2. Sem RPC de fallback para evitar erros 400; retornar vazio se não houver pallets
      // Mantemos estoqueFEFO como está quando não há pallets alocados

      // Ordenar por prioridade FEFO
      const estoqueFEFOOrdenado = estoqueFEFO.sort((a, b) => a.prioridade_fefo - b.prioridade_fefo);
      
      console.log('✅ Estoque FEFO processado:', estoqueFEFOOrdenado);
      return estoqueFEFOOrdenado;
    },
    enabled: !!(produtoId && depositoId),
    refetchOnWindowFocus: false,
    retry: false,
  });
};

// Função para calcular prioridade FEFO
function calcularPrioridadeFEFO(dataValidade?: string, dataEntrada?: string): number {
  let prioridade = 0;
  
  // Prioridade por data de validade (quanto menor, maior prioridade)
  if (dataValidade) {
    const vencimento = new Date(dataValidade).getTime();
    prioridade = vencimento;
  } else {
    // Se não tem validade, usar data muito distante (menor prioridade)
    prioridade = new Date('2099-12-31').getTime();
  }
  
  // Critério de desempate: data de entrada (mais antigo = maior prioridade)
  if (dataEntrada) {
    const entrada = new Date(dataEntrada).getTime();
    // Subtrair pequeno valor baseado na data de entrada para priorizar mais antigos
    prioridade -= (new Date('2099-12-31').getTime() - entrada) / 1000000;
  }
  
  return prioridade;
}