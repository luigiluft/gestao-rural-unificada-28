import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProductLatestPrice = (produtoId?: string, depositoId?: string) => {
  return useQuery({
    queryKey: ["produto-latest-price", produtoId, depositoId],
    queryFn: async () => {
      if (!produtoId || !depositoId) return null

      // Buscar o valor unitário mais recente das movimentações de entrada para este produto
      const { data: movimentacao, error } = await supabase
        .from("movimentacoes")
        .select("valor_unitario")
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId)
        .eq("tipo_movimentacao", "entrada")
        .not("valor_unitario", "is", null)
        .order("data_movimentacao", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.log('Nenhum preço encontrado para produto:', produtoId)
        return null
      }

      return movimentacao?.valor_unitario || null
    },
    enabled: !!(produtoId && depositoId),
    refetchOnWindowFocus: false,
    retry: false,
  })
}