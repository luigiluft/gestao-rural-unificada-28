import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useViagens = () => {
  return useQuery({
    queryKey: ["viagens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select(`
          *,
          viagem_remessas(
            id,
            ordem_entrega,
            remessas(
              id,
              numero,
              peso_total,
              total_volumes,
              valor_total,
              status,
              data_criacao
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}

export const useViagemById = (id: string) => {
  return useQuery({
    queryKey: ["viagem", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select(`
          *,
          viagem_remessas(
            id,
            ordem_entrega,
            remessas(
              id,
              numero,
              peso_total,
              total_volumes,
              valor_total,
              status,
              data_criacao
            )
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}