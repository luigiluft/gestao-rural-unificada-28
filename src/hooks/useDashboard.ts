import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get total stock count
      const { count: totalEstoque } = await supabase
        .from("estoque")
        .select("*", { count: "exact", head: true })

      // Get active products count
      const { count: produtosAtivos } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true)

      // Get total stock value
      const { data: estoqueData } = await supabase
        .from("estoque")
        .select("quantidade_atual, valor_medio")

      const valorTotal = estoqueData?.reduce((acc, item) => {
        return acc + (item.quantidade_atual * (item.valor_medio || 0))
      }, 0) || 0

      // Get low stock alerts (where current < minimum threshold)
      const { data: alertas } = await supabase
        .from("estoque")
        .select(`
          *,
          produtos(nome, unidade_medida)
        `)
        .lt("quantidade_atual", 100) // Simple threshold for now

      return {
        totalEstoque: totalEstoque || 0,
        produtosAtivos: produtosAtivos || 0,
        valorTotal,
        alertas: alertas?.length || 0,
        alertasDetalhes: alertas || []
      }
    },
  })
}

export const useRecentMovements = () => {
  return useQuery({
    queryKey: ["recent-movements"],
    queryFn: async () => {
      const { data: movimentacoes, error } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos(nome)
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(5)

      if (error) throw error

      // Get franquia names for each movement
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