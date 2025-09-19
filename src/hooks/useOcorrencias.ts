import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useOcorrencias = (filters?: { status?: string; tipo?: string }) => {
  return useQuery({
    queryKey: ["ocorrencias", filters],
    queryFn: async () => {
      let query = supabase
        .from("ocorrencias")
        .select("*")

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.tipo) {
        query = query.eq("tipo", filters.tipo)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}