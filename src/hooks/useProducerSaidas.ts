import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProducerSaidas = () => {
  return useQuery({
    queryKey: ["producer-saidas"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data: saidas, error } = await supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          ),
          rastreamentos(
            codigo_rastreamento,
            status_atual,
            transportadora,
            data_prevista_entrega
          )
        `)
        .eq("user_id", user.user.id)
        .in("status", ["separacao_pendente", "separado", "expedido"])
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get franquia names for each saida
      const saidasWithFranquias = await Promise.all(
        (saidas || []).map(async (saida) => {
          if (saida.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", saida.deposito_id)
              .single()
            
            return {
              ...saida,
              franquia_nome: franquia?.nome
            }
          }
          return saida
        })
      )

      return saidasWithFranquias || []
    },
  })
}