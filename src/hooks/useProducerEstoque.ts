import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

export const useProducerEstoque = () => {
  const { depositoId, shouldFilter } = useDepositoFilter()

  return useQuery({
    queryKey: ["producer-estoque", depositoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data: estoqueData, error } = await supabase
        .rpc("get_estoque_from_movimentacoes")

      if (error) throw error

      // Filter to only user's products and map the data
      let estoqueFormatado = (estoqueData || [])
        .filter((item: any) => item.user_id === user.user.id && item.quantidade_atual > 0)
        .map((item: any) => ({
          ...item,
          produtos: typeof item.produtos === 'string' ? JSON.parse(item.produtos) : item.produtos
        }))

      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        estoqueFormatado = estoqueFormatado.filter((item: any) => item.deposito_id === depositoId)
      }

      return estoqueFormatado.sort((a, b) => b.quantidade_atual - a.quantidade_atual)
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}