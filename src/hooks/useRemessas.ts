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
          saidas:saidas(count)
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
        .select("*")
        .in("status", ["criada", "pronta"])
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}