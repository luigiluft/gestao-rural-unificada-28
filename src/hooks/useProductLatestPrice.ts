import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProductLatestPrice = (produtoId?: string, depositoId?: string) => {
  return useQuery({
    queryKey: ["produto-latest-price", produtoId, depositoId],
    queryFn: async () => {
      console.log('Buscando preço para produto:', produtoId, 'no depósito:', depositoId)
      
      if (!produtoId || !depositoId) {
        console.log('Parâmetros insuficientes para buscar preço')
        return null
      }

      // Buscar o valor unitário mais recente das movimentações de entrada para este produto
      const { data: movimentacao, error } = await supabase
        .from("movimentacoes")
        .select("valor_unitario, data_movimentacao")
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId)
        .eq("tipo_movimentacao", "entrada")
        .not("valor_unitario", "is", null)
        .order("data_movimentacao", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar preço:', error)
        return null
      }

      if (!movimentacao) {
        console.log('Nenhuma movimentação com preço encontrada para produto:', produtoId)
        return null
      }

      console.log('Preço encontrado:', movimentacao.valor_unitario, 'em', movimentacao.data_movimentacao)
      return movimentacao.valor_unitario
    },
    enabled: !!(produtoId && depositoId),
    refetchOnWindowFocus: false,
    retry: false,
  })
}