import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProducerEstoque = () => {
  return useQuery({
    queryKey: ["producer-estoque-calculado"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data: estoque, error } = await supabase
        .from("estoque_calculado")
        .select(`
          *,
          produtos(nome, unidade_medida)
        `)
        .eq("user_id", user.user.id)
        .gt("quantidade_atual", 0)
        .order("quantidade_atual", { ascending: false })

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
              franquia_nome: franquia?.nome
            }
          }
          return item
        })
      )

      return estoqueWithFranquias || []
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}