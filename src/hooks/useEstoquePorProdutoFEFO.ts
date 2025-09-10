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
  posicao_codigo?: string;
  posicao_id?: string;
  dias_para_vencer?: number;
  prioridade_fefo: number;
  status_validade: 'critico' | 'atencao' | 'normal';
  pallet_id?: string;
  pallet_numero?: number;
}

export const useEstoquePorProdutoFEFO = (produtoId?: string, depositoId?: string) => {
  return useQuery({
    queryKey: ["estoque-fefo", produtoId, depositoId],
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
        // Processar os pallets em dados FEFO
        const palletsFEFO = palletsData.flatMap((pallet) => {
          return pallet.entrada_pallet_itens
            .filter(item => item.entrada_itens.produto_id === produtoId)
            .map((item) => {
              const entrada = pallet.entradas;
              const position = pallet.pallet_positions[0];
              const entradaItem = item.entrada_itens;
              
              // Calcular dias para vencer de forma determinística
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

              return {
                id: `pallet-${pallet.id}-item-${item.id}`,
                produto_id: entradaItem.produto_id,
                produto_nome: entradaItem.nome_produto,
                deposito_id: entrada.deposito_id,
                quantidade_atual: item.quantidade,
                lote: entradaItem.lote || `P${pallet.numero_pallet}-${entrada.id.substring(0, 8)}`,
                data_validade: entradaItem.data_validade,
                data_entrada: entrada.data_entrada,
                posicao_codigo: position?.storage_positions?.codigo || `PALLET-${pallet.numero_pallet}`,
                posicao_id: position?.posicao_id,
                dias_para_vencer: diasParaVencer,
                prioridade_fefo: calcularPrioridadeFEFO(entradaItem.data_validade, entrada.data_entrada),
                status_validade: statusValidade,
                pallet_id: pallet.id,
                pallet_numero: pallet.numero_pallet
              };
            });
        });
        estoqueFEFO.push(...palletsFEFO);
      }

      // 2. Buscar produtos que vieram de allocation_waves com posições ocupadas
      const { data: wavesData, error: wavesError } = await supabase
        .from("movimentacoes")
        .select(`
          referencia_id,
          lote,
          data_movimentacao,
          quantidade
        `)
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId)
        .eq("referencia_tipo", "allocation_wave")
        .eq("tipo_movimentacao", "entrada");

      if (wavesError) {
        console.error('❌ Erro ao buscar allocation_waves:', wavesError);
      } else if (wavesData && wavesData.length > 0) {
        // Para cada movimentação de wave, buscar posições ocupadas no depósito
        const { data: positionsData } = await supabase
          .from("storage_positions")
          .select("id, codigo")
          .eq("deposito_id", depositoId)
          .eq("ocupado", true)
          .limit(1); // Pegar a primeira posição ocupada como sugestão
        
        const { data: productData } = await supabase
          .from("produtos")
          .select("nome")
          .eq("id", produtoId)
          .single();

        // Processar allocation_waves em dados FEFO
        const wavesFEFO = wavesData.map((wave, index) => {
          const position = positionsData?.[0];
          
          return {
            id: `wave-${wave.referencia_id}-${index}`,
            produto_id: produtoId,
            produto_nome: productData?.nome || "Produto não encontrado",
            deposito_id: depositoId,
            quantidade_atual: wave.quantidade,
            lote: wave.lote || `WAVE-${wave.referencia_id.substring(0, 8)}`,
            data_validade: undefined,
            data_entrada: wave.data_movimentacao.split('T')[0],
            posicao_codigo: position?.codigo || `WAVE-${wave.referencia_id.substring(0, 8)}`,
            posicao_id: position?.id,
            dias_para_vencer: 999,
            prioridade_fefo: calcularPrioridadeFEFO(undefined, wave.data_movimentacao),
            status_validade: 'normal' as const,
            pallet_id: undefined,
            pallet_numero: undefined
          };
        });
        estoqueFEFO.push(...wavesFEFO);
      }

      // 3. Se não encontrou nada, buscar no estoque geral
      if (estoqueFEFO.length === 0) {
        const { data: estoqueData, error: estoqueError } = await supabase
          .from("estoque")
          .select(`
            produto_id,
            deposito_id,
            quantidade_atual,
            produtos!inner(
              nome
            )
          `)
          .eq("produto_id", produtoId)
          .eq("deposito_id", depositoId)
          .gt("quantidade_atual", 0);

        if (!estoqueError && estoqueData && estoqueData.length > 0) {
          const estoqueGenerico = estoqueData.map((estoque, index) => ({
            id: `estoque-${estoque.produto_id}-${index}`,
            produto_id: estoque.produto_id,
            produto_nome: estoque.produtos.nome,
            deposito_id: estoque.deposito_id,
            quantidade_atual: estoque.quantidade_atual,
            lote: "SEM LOTE",
            data_validade: undefined,
            data_entrada: new Date().toISOString().split('T')[0],
            posicao_codigo: "SEM POSIÇÃO",
            posicao_id: undefined,
            dias_para_vencer: 999,
            prioridade_fefo: calcularPrioridadeFEFO(undefined, new Date().toISOString()),
            status_validade: 'normal' as const,
            pallet_id: undefined,
            pallet_numero: undefined
          }));
          estoqueFEFO.push(...estoqueGenerico);
        }
      }

      // Ordenar por prioridade FEFO (data de validade ASC, depois data de entrada ASC)
      const estoqueFEFOOrdenado = estoqueFEFO.sort((a, b) => a.prioridade_fefo - b.prioridade_fefo);
      
      console.log('✅ Estoque FEFO processado:', estoqueFEFOOrdenado);
      return estoqueFEFOOrdenado;
    },
    enabled: !!(produtoId && depositoId),
    refetchOnWindowFocus: false,
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