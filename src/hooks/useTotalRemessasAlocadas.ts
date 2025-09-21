import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useTotalRemessasAlocadas = () => {
  return useQuery({
    queryKey: ["total-remessas-alocadas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("saidas")
        .select("*", { count: "exact", head: true })
        .eq("status", "em_transito")

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
      // Get all viagens with their associated saidas
      const { data: viagens, error } = await supabase
        .from("viagens")
        .select(`
          *,
          saidas:saidas(
            id,
            numero_saida,
            status,
            peso_total,
            valor_total,
            data_saida,
            observacoes
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return viagens || []
    },
    staleTime: 30000,
  })
}