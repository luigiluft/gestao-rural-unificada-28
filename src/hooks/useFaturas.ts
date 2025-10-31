import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFaturas = (filters?: {
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  contrato_id?: string
  franquia_id?: string
  mes?: string
}) => {
  return useQuery({
    queryKey: ['faturas', filters],
    queryFn: async () => {
      let query = supabase
        .from('faturas')
        .select(`
          *,
          contratos:contrato_id (
            numero_contrato,
            franquia_id,
            produtor_id
          ),
          franquias:franquia_id (
            nome
          ),
          produtores_profiles:produtor_id (
            nome
          )
        `)
        .order('data_emissao', { ascending: false })

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.contrato_id) {
        query = query.eq('contrato_id', filters.contrato_id)
      }

      if (filters?.franquia_id) {
        query = query.eq('franquia_id', filters.franquia_id)
      }

      const { data, error } = await query

      if (error) throw error

      // Apply month filter in JavaScript (after fetching)
      let result = data || []
      if (filters?.mes) {
        result = result.filter(f => {
          const mes = new Date(f.data_emissao).toISOString().substring(0, 7)
          return mes === filters.mes
        })
      }

      return result
    },
  })
}

export const useFaturaStats = () => {
  return useQuery({
    queryKey: ['faturas', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas')
        .select('status, valor_total, data_vencimento')

      if (error) throw error

      const now = new Date()
      const pendentes = data?.filter(f => f.status === 'pendente')?.length || 0
      const pagas = data?.filter(f => f.status === 'pago')?.length || 0
      const vencidas = data?.filter(f => {
        return f.status === 'pendente' && new Date(f.data_vencimento) < now
      })?.length || 0

      const receitaTotal = data
        ?.filter(f => f.status === 'pago')
        ?.reduce((acc, f) => acc + (f.valor_total || 0), 0) || 0

      const receitaPendente = data
        ?.filter(f => f.status === 'pendente')
        ?.reduce((acc, f) => acc + (f.valor_total || 0), 0) || 0

      return {
        pendentes,
        pagas,
        vencidas,
        receitaTotal,
        receitaPendente,
      }
    },
  })
}
