import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useRemessas = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: ["remessas", filters],
    queryFn: async () => {
      let query = supabase
        .from("remessas")
        .select(`
          *,
          viagem_remessas(
            viagem_id,
            viagens(
              numero,
              data_inicio
            )
          )
        `)

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}

export const useRemessasDisponiveis = () => {
  return useQuery({
    queryKey: ["remessas", "disponiveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("remessas")
        .select(`
          *,
          viagem_remessas(viagem_id)
        `)
        .in("status", ["criada", "pronta"])
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Filter out remessas that are already allocated to a viagem
      return data?.filter(remessa => !remessa.viagem_remessas || remessa.viagem_remessas.length === 0) || []
    },
    staleTime: 30000,
  })
}