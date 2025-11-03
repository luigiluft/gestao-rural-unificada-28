import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface UseContratosFranquiaFilters {
  status?: 'ativo' | 'suspenso' | 'cancelado'
  franquia_id?: string
}

export const useContratosFranquia = (filters?: UseContratosFranquiaFilters) => {
  return useQuery({
    queryKey: ['contratos-franquia', filters],
    queryFn: async () => {
      let query = supabase
        .from('contrato_franquia')
        .select(`*`)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.franquia_id) {
        query = query.eq('franquia_id', filters.franquia_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

export const useContratoFranquiaById = (id: string) => {
  return useQuery({
    queryKey: ['contrato-franquia', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_franquia')
        .select(`
          *,
          franquias (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
