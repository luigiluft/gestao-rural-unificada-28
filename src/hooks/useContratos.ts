import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useContratos = (filters?: {
  status?: 'ativo' | 'suspenso' | 'expirado' | 'cancelado'
  franquia_id?: string
  produtor_id?: string
}) => {
  return useQuery({
    queryKey: ['contratos', filters],
    queryFn: async () => {
      let query = supabase
        .from('contratos_servico')
        .select(`
          *,
          franquias:franquia_id (
            id,
            nome,
            cnpj
          ),
          produtores_profiles:produtor_id!inner (
            nome,
            cpf_cnpj
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.franquia_id) {
        query = query.eq('franquia_id', filters.franquia_id)
      }

      if (filters?.produtor_id) {
        query = query.eq('produtor_id', filters.produtor_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

export const useContratoStats = () => {
  return useQuery({
    queryKey: ['contratos', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_servico')
        .select('status, data_fim')

      if (error) throw error

      const now = new Date()
      const total = data?.length || 0
      const ativos = data?.filter(c => c.status === 'ativo')?.length || 0
      const aVencer = data?.filter(c => {
        if (c.status !== 'ativo' || !c.data_fim) return false
        const dataFim = new Date(c.data_fim)
        const diasRestantes = Math.ceil((dataFim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diasRestantes > 0 && diasRestantes <= 30
      })?.length || 0
      const vencidos = data?.filter(c => {
        if (!c.data_fim) return false
        return new Date(c.data_fim) < now
      })?.length || 0

      return {
        total,
        ativos,
        aVencer,
        vencidos,
      }
    },
  })
}
