import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useComprovantesEntrega = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: ["comprovantes_entrega", filters],
    queryFn: async () => {
      let query = supabase
        .from("comprovantes_entrega")
        .select("*")

      if (filters?.status && filters.status !== 'all') {
        query = query.eq("status", filters.status as any)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}