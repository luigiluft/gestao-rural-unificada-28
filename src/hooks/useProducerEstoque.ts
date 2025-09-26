import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProducerEstoque = () => {
  return useQuery({
    queryKey: ["producer-estoque"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data: estoqueData, error } = await supabase
        .rpc("get_estoque_from_movimentacoes")

      if (error) throw error

      // Filter to only user's products and map the data
      const estoqueFormatado = (estoqueData || [])
        .filter((item: any) => item.user_id === user.user.id && item.quantidade_atual > 0)
        .map((item: any) => ({
          ...item,
          produtos: typeof item.produtos === 'string' ? JSON.parse(item.produtos) : item.produtos
        }))
        .sort((a, b) => b.quantidade_atual - a.quantidade_atual)

      return estoqueFormatado
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}