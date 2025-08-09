import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEstoque = () => {
  return useQuery({
    queryKey: ["estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select(`
          *,
          produtos(nome, unidade_medida),
          depositos(nome)
        `)
        .order("quantidade_atual", { ascending: true })

      if (error) throw error
      return data || []
    },
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
          produtos(nome),
          depositos(nome)
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(10)

      if (produtoId) {
        query = query.eq("produto_id", produtoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}