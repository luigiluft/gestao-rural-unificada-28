import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useTotalRemessasAlocadas = () => {
  return useQuery({
    queryKey: ["total-remessas-alocadas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("saidas")
        .select("*", { count: "exact", head: true })
        .not("viagem_id", "is", null)

      if (error) throw error
      return count || 0
    },
    staleTime: 30000,
  })
}

export const useViagemComRemessas = () => {
  return useQuery({
    queryKey: ["viagens-com-remessas"],
    queryFn: async () => {
      console.log('🔍 useViagemComRemessas: Fetching viagens with remessas...')
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 useViagemComRemessas: Current session:', session?.user?.id)
      
      // Get all viagens with their associated saidas
      const { data: viagens, error } = await supabase
        .from("viagens")
        .select(`
          *,
          saidas:saidas(
            id,
            numero_saida,
            status,
            peso_total,
            valor_total,
            data_saida,
            observacoes
          )
        `)
        .order("created_at", { ascending: false })

      console.log('🔍 useViagemComRemessas: Query result:', { viagens, error })
      
      if (error) {
        console.error('❌ useViagemComRemessas: Error fetching viagens:', error)
        throw error
      }
      
      console.log('✅ useViagemComRemessas: Found', viagens?.length || 0, 'viagens')
      return viagens || []
    },
    staleTime: 30000,
  })
}