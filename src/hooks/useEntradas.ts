import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

export const useEntradas = (dateRange?: { from?: Date; to?: Date }) => {
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["entradas", dateRange, depositoId],
    queryFn: async () => {
      console.log('[useEntradas] Starting query with dateRange:', dateRange);
      
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useEntradas] Current user:', user?.id);
      
      let query = supabase
        .from("entradas")
        .select(`
          *,
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

      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data: entradas, error } = await query.order("created_at", { ascending: false })

      console.log('[useEntradas] Query result:', { 
        entriesCount: entradas?.length || 0, 
        error: error?.message,
        firstEntry: entradas?.[0]
      });

      if (error) {
        console.error('[useEntradas] Query error:', error);
        throw error;
      }

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

      console.log('[useEntradas] Final result:', {
        totalEntries: entradasWithFranquias?.length || 0,
        depositoIds: [...new Set(entradasWithFranquias?.map(e => e.deposito_id))],
        franquiasFound: franquiasMap.size
      });

      return entradasWithFranquias || []
    },
    // Add some caching to reduce requests
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}