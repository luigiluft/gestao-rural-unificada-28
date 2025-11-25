import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

export const useProducerSaidas = () => {
  const { depositoId, shouldFilter } = useDepositoFilter()

  return useQuery({
    queryKey: ["producer-saidas", depositoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      let query = supabase
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

      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data: saidas, error } = await query.order("created_at", { ascending: false })

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