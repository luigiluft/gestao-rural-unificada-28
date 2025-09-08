import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEntradas = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["entradas", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("entradas")
        .select(`
          *,
          fornecedores(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          ),
          franquias:deposito_id(nome)
        `)

      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte("created_at", endDate.toISOString())
      }

      const { data: entradas, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      return entradas || []
    },
    // Add some caching to reduce requests
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}