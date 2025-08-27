import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEstoque = () => {
  return useQuery({
    queryKey: ["estoque"],
    queryFn: async () => {
      const { data: estoque, error } = await supabase
        .from("estoque")
        .select(`
          *,
          produtos(nome, unidade_medida)
        `)
        .order("quantidade_atual", { ascending: true })

      if (error) throw error

      // Get franquia names for each estoque item
      const estoqueWithFranquias = await Promise.all(
        (estoque || []).map(async (item) => {
          if (item.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", item.deposito_id)
              .single()
            
            return {
              ...item,
              franquias: franquia
            }
          }
          return item
        })
      )

      return estoqueWithFranquias || []
    },
    // Force refetch every time the component mounts
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export const useMovimentacoes = (produtoId?: string) => {
  return useQuery({
    queryKey: ["movimentacoes", produtoId],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos(nome)
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(10)

      if (produtoId) {
        query = query.eq("produto_id", produtoId)
      }

      const { data: movimentacoes, error } = await query

      if (error) throw error

      // Get franquia names for each movimentacao
      const movimentacoesWithFranquias = await Promise.all(
        (movimentacoes || []).map(async (mov) => {
          if (mov.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", mov.deposito_id)
              .single()
            
            return {
              ...mov,
              franquias: franquia
            }
          }
          return mov
        })
      )

      return movimentacoesWithFranquias || []
    },
  })
}