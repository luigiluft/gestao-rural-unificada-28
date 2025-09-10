import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEstoque = () => {
  return useQuery({
    queryKey: ["estoque"],
    queryFn: async () => {
      // Use função segura que aplica RLS baseado no role do usuário
      const { data: estoque, error } = await supabase
        .rpc("get_estoque_seguro")

      if (error) throw error

      // Mapear os dados para o formato esperado pelo frontend
      const estoqueFormatado = (estoque || []).map((item: any) => ({
        ...item,
        franquias: item.franquia_nome ? { nome: item.franquia_nome } : null
      }))

      return estoqueFormatado
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