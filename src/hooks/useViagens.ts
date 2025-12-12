import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface Viagem {
  id: string
  numero: string
  user_id: string
  deposito_id: string
  status: string
  veiculo_id: string | null
  motorista_id: string | null
  data_inicio: string | null
  data_fim: string | null
  hodometro_inicio: number | null
  hodometro_fim: number | null
  combustivel_inicio: number | null
  combustivel_fim: number | null
  distancia_total: number
  distancia_percorrida: number
  total_remessas: number
  remessas_entregues: number
  observacoes: string | null
  created_at: string
  updated_at: string
  peso_total: number | null
  previsao_inicio: string | null
  // Novos campos TMS (Fase 4)
  frete_id: string | null
  tipo_execucao: string | null
  paradas: Record<string, unknown>[] | null
  pod: Record<string, unknown> | null
  ocorrencias_viagem: Record<string, unknown>[] | null
}

export const useViagens = (clienteId?: string) => {
  return useQuery({
    queryKey: ["viagens", clienteId],
    queryFn: async () => {
      console.log('🔍 useViagens: Fetching viagens...')
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 useViagens: Current session:', session?.user?.id)
      
      let query = supabase
        .from("viagens")
        .select("*")
        .order("created_at", { ascending: false })

      // Se clienteId for fornecido, filtrar por deposito_id associado ao cliente
      // Isso requer uma join ou RLS apropriado
      
      const { data, error } = await query

      console.log('🔍 useViagens: Query result:', { data, error })
      
      if (error) {
        console.error('❌ useViagens: Error fetching viagens:', error)
        throw error
      }
      
      console.log('✅ useViagens: Found', data?.length || 0, 'viagens')
      return (data || []) as Viagem[]
    },
    staleTime: 30000,
  })
}

export const useViagemById = (id: string) => {
  return useQuery({
    queryKey: ["viagem", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return data as Viagem
    },
    enabled: !!id,
  })
}

export const useViagensByFrete = (freteId: string) => {
  return useQuery({
    queryKey: ["viagens", "frete", freteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("frete_id", freteId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []) as Viagem[]
    },
    enabled: !!freteId,
  })
}
