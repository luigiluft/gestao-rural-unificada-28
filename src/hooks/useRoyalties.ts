import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface UseRoyaltiesFilters {
  status?: 'rascunho' | 'pendente' | 'pago' | 'vencido' | 'cancelado'
  franquia_id?: string
  contrato_franquia_id?: string
}

export const useRoyalties = (filters?: UseRoyaltiesFilters) => {
  return useQuery({
    queryKey: ['royalties', filters],
    queryFn: async () => {
      let query = supabase
        .from('royalties')
        .select(`
          *,
          franquias (
            id,
            nome,
            cnpj
          ),
          contrato_franquia (
            id,
            numero_contrato,
            tipo_royalty
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.franquia_id) {
        query = query.eq('franquia_id', filters.franquia_id)
      }

      if (filters?.contrato_franquia_id) {
        query = query.eq('contrato_franquia_id', filters.contrato_franquia_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

export const useRoyaltyById = (id: string) => {
  return useQuery({
    queryKey: ['royalty', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('royalties')
        .select(`
          *,
          franquias (
            id,
            nome,
            cnpj
          ),
          contrato_franquia (
            id,
            numero_contrato,
            tipo_royalty,
            percentual_faturamento,
            valor_fixo_mensal,
            margens_servico
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

export const useRoyaltyStats = () => {
  return useQuery({
    queryKey: ['royalty-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('royalties')
        .select('status, valor_total, data_vencimento')

      if (error) throw error

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const stats = {
        total: data.length,
        pendentes: data.filter(r => r.status === 'pendente').length,
        pagos: data.filter(r => r.status === 'pago').length,
        totalReceber: data
          .filter(r => r.status === 'pendente')
          .reduce((sum, r) => sum + Number(r.valor_total || 0), 0),
        recebidoMes: data
          .filter(r => {
            if (r.status !== 'pago') return false
            const dataPagamento = new Date(r.data_vencimento)
            return dataPagamento.getMonth() === hoje.getMonth() &&
                   dataPagamento.getFullYear() === hoje.getFullYear()
          })
          .reduce((sum, r) => sum + Number(r.valor_total || 0), 0),
        vencimentosHoje: data.filter(r => {
          const vencimento = new Date(r.data_vencimento)
          vencimento.setHours(0, 0, 0, 0)
          return vencimento.getTime() === hoje.getTime() && r.status === 'pendente'
        }).length,
      }

      return stats
    },
  })
}
