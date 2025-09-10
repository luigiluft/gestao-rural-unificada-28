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
}

export const useEstoquePorProdutoFEFO = (produtoId?: string, depositoId?: string) => {
  return useQuery({
    queryKey: ["estoque-fefo", produtoId, depositoId],
    queryFn: async () => {
      if (!produtoId || !depositoId) return [];

      console.log('🔍 Buscando estoque FEFO para produto:', produtoId, 'depósito:', depositoId);
      
      // Buscar movimentações do produto no depósito
      const { data: movimentacoes, error } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          produto_id,
          deposito_id,
          quantidade,
          lote,
          data_movimentacao,
          referencia_id,
          referencia_tipo,
          produtos!inner(id, nome)
        `)
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId)
        .eq("tipo_movimentacao", "entrada")
        .gt("quantidade", 0);

      if (error) {
        console.error('❌ Erro ao buscar movimentações:', error);
        throw error;
      }

      // Buscar estoque atual para verificar quantidades disponíveis
      const { data: estoqueAtual, error: estoqueError } = await supabase
        .from("estoque")
        .select("*")
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId);

      if (estoqueError) {
        console.error('❌ Erro ao buscar estoque atual:', error);
        throw estoqueError;
      }

      // Buscar posições de armazenagem relacionadas aos lotes
      const { data: posicoes, error: posicoesError } = await supabase
        .from("storage_positions")
        .select("id, codigo, deposito_id, ocupado")
        .eq("deposito_id", depositoId)
        .eq("ocupado", true);

      if (posicoesError) {
        console.error('❌ Erro ao buscar posições:', posicoesError);
      }

      // Para demonstração, vamos buscar dados fictícios baseados nas movimentações
      const estoqueFEFO: EstoqueFEFO[] = movimentacoes.map((mov, index) => {
        // Usar data fixa baseada no índice para evitar loop de re-renderização
        const baseDate = new Date(mov.data_movimentacao);
        const diasFixos = 30 + (index * 15); // Dias fixos baseados no índice
        const dataValidade = new Date(baseDate.getTime() + (diasFixos * 24 * 60 * 60 * 1000));
        
        const hoje = new Date();
        const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
        if (diasParaVencer <= 15) {
          statusValidade = 'critico';
        } else if (diasParaVencer <= 30) {
          statusValidade = 'atencao';
        }

        // Encontrar posição relacionada de forma determinística
        const posicaoRelacionada = posicoes?.[index % (posicoes?.length || 1)];
        
        return {
          id: mov.id,
          produto_id: mov.produto_id,
          produto_nome: mov.produtos.nome,
          deposito_id: mov.deposito_id,
          quantidade_atual: mov.quantidade,
          lote: mov.lote || `LT${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
          data_validade: dataValidade.toISOString().split('T')[0],
          data_entrada: mov.data_movimentacao,
          posicao_codigo: posicaoRelacionada?.codigo || `R${String(Math.floor(index / 10) + 1).padStart(2, '0')}-M${String((index % 10) + 1).padStart(2, '0')}-A${String((index % 5) + 1)}`,
          posicao_id: posicaoRelacionada?.id,
          dias_para_vencer: diasParaVencer,
          prioridade_fefo: calcularPrioridadeFEFO(dataValidade.toISOString().split('T')[0], mov.data_movimentacao),
          status_validade: statusValidade
        };
      });

      // Ordenar por prioridade FEFO
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