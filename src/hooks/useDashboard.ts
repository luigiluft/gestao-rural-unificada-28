import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get stock data from new function
      const { data: estoqueData } = await supabase
        .rpc("get_estoque_from_movimentacoes")
      
      const totalEstoque = Array.isArray(estoqueData) ? estoqueData.length : 0

      // Get active products count
      const { count: produtosAtivos } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true)

      const valorTotal = Array.isArray(estoqueData) ? estoqueData.reduce((acc, item) => {
        return acc + (item.valor_total || 0)
      }, 0) : 0

      // Get low stock alerts from new function
      const alertas = Array.isArray(estoqueData) ? estoqueData.filter(item => item.quantidade_atual < 100) : []

      return {
        totalEstoque,
        produtosAtivos: produtosAtivos || 0,
        valorTotal,
        alertas: alertas.length,
        alertasDetalhes: alertas
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