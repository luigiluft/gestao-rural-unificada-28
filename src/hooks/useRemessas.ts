import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useRemessas = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: ["remessas", filters],
    queryFn: async () => {
      let query = supabase
        .from("saidas")
        .select("*")
        .eq("status", "expedido")
        .is("viagem_id", null) // Only show saidas that are not allocated to any trip

      if (filters?.status) {
        // Only filter expedited saidas that are not planned
        if (filters.status === "expedido") {
          query = query.eq("status", "expedido")
        } else if (filters.status === "entregue") {
          query = query.eq("status", "entregue")
        }
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
        .from("saidas")
        .select("*")
        .eq("status", "expedido")
        .is("viagem_id", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}