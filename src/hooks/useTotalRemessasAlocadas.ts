import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useTotalRemessasAlocadas = () => {
  return useQuery({
    queryKey: ["total-remessas-alocadas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("viagem_remessas")
        .select("*", { count: "exact", head: true })

      if (error) throw error
      return count || 0
    },
    staleTime: 30000,
  })
}

export const useViagemComRemessas = () => {
  return useQuery({
    queryKey: ["viagens-com-remessas"],
    queryFn: async () => {
      // First get all viagens
      const { data: viagens, error } = await supabase
        .from("viagens")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Then get remessas for each viagem
      const viagensWithRemessas = await Promise.all(
        (viagens || []).map(async (viagem) => {
          const { data: viagemRemessas } = await supabase
            .from("viagem_remessas")
            .select(`
              id,
              remessa_id,
              ordem_entrega,
              remessas:remessas(
                id,
                numero,
                status,
                peso_total,
                total_volumes,
                valor_total
              )
            `)
            .eq("viagem_id", viagem.id)

          return {
            ...viagem,
            viagem_remessas: viagemRemessas || []
          }
        })
      )

      return viagensWithRemessas
    },
    staleTime: 30000,
  })
}