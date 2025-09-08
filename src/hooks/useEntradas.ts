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
          )
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

      // Optimize: Get unique deposito_ids and batch fetch franquias
      const depositoIds = [...new Set(entradas?.map(e => e.deposito_id).filter(Boolean))]
      
      let franquiasMap = new Map()
      if (depositoIds.length > 0) {
        const { data: franquias } = await supabase
          .from("franquias")
          .select("id, nome")
          .in("id", depositoIds)
        
        franquias?.forEach(f => franquiasMap.set(f.id, f))
      }

      // Map franquias to entradas
      const entradasWithFranquias = entradas?.map(entrada => ({
        ...entrada,
        franquias: entrada.deposito_id ? franquiasMap.get(entrada.deposito_id) : null
      }))

      return entradasWithFranquias || []
    },
    // Add some caching to reduce requests
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}