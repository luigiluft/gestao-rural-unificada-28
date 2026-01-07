import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

export const useSaidas = (dateRange?: { from?: Date; to?: Date }) => {
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["saidas", dateRange, depositoId],
    queryFn: async () => {
      console.log('🔍 HOOK DEBUG - useSaidas INICIANDO')
      console.log('📅 dateRange:', dateRange)
      
      try {
        // Get current user to determine role and build appropriate query
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Get user profile to check role
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single()

        // Base query with JOINs for franquias, saida_itens, and entrada_gerada
        const baseSelectQuery = `
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          ),
          franquias:deposito_id(nome),
          entrada_gerada:entrada_gerada_id(id, numero_nfe)
        `

        let query = supabase
          .from("saidas")
          .select(baseSelectQuery)

        let saidasData: any[] = []

        // For producers, we need to handle two cases:
        // 1. Their own saídas (with date filter)
        // 2. Pending approval saídas from franchisees (always shown, regardless of date)
        if (userProfile?.role === 'cliente') {
          // First, get their own saídas with date filters
          let ownSaidasQuery = supabase
            .from("saidas")
            .select(baseSelectQuery)
            .eq("user_id", user.id)

          // Apply date filters for own saídas
          if (dateRange?.from) {
            ownSaidasQuery = ownSaidasQuery.gte("created_at", dateRange.from.toISOString())
          }
          if (dateRange?.to) {
            const endDate = new Date(dateRange.to)
            endDate.setHours(23, 59, 59, 999)
            ownSaidasQuery = ownSaidasQuery.lte("created_at", endDate.toISOString())
          }

          // Apply deposit filter if needed
          if (shouldFilter && depositoId) {
            ownSaidasQuery = ownSaidasQuery.eq("deposito_id", depositoId)
          }

          // Second, get approval saídas from franchisees (no date filter)
          // Show pending and approved saídas, hide only rejected ones
          let pendingSaidasQuery = supabase
            .from("saidas")
            .select(baseSelectQuery)
            .eq("criado_por_franqueado", true)
            .eq("produtor_destinatario_id", user.id)
            .in("status_aprovacao_produtor", ["pendente", "aprovado"])

          // Apply deposit filter if needed
          if (shouldFilter && depositoId) {
            pendingSaidasQuery = pendingSaidasQuery.eq("deposito_id", depositoId)
          }

          console.log('🚀 Executando queries para produtor...')
          const [ownSaidasResult, pendingSaidasResult] = await Promise.all([
            ownSaidasQuery.order("created_at", { ascending: false }),
            pendingSaidasQuery.order("created_at", { ascending: false })
          ])

          if (ownSaidasResult.error) throw ownSaidasResult.error
          if (pendingSaidasResult.error) throw pendingSaidasResult.error

          // Combine results, avoiding duplicates
          const ownSaidas = ownSaidasResult.data || []
          const pendingSaidas = pendingSaidasResult.data || []
          
          console.log('📊 Own saídas:', ownSaidas.length)
          console.log('📊 Pending approval saídas:', pendingSaidas.length)

          // Merge and remove duplicates by id
          const allSaidas = [...ownSaidas, ...pendingSaidas]
          const uniqueSaidas = allSaidas.filter((saida, index, array) => 
            array.findIndex(s => s.id === saida.id) === index
          )
          
          saidasData = uniqueSaidas.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )

        } else {
          // For non-producers, use the original query with date filters
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

          console.log('🚀 Executando query para não-produtor...')
          const result = await query.order("created_at", { ascending: false })
          if (result.error) throw result.error
          saidasData = result.data || []
        }

        const saidasError = null // Already handled above

        console.log('📊 Resultado da query principal:')
        console.log('- saidasData:', saidasData)
        console.log('- saidasError:', saidasError)
        console.log('- Quantidade de saídas:', saidasData?.length || 0)
        
        if (saidasError) {
          console.error('❌ ERRO na query principal:', saidasError)
          throw saidasError
        }

        // Now data already includes the joined profile and franquia names
        console.log('🎯 RESULTADO FINAL:')
        console.log('- Total de saídas processadas:', saidasData.length)
        console.log('- Dados finais:', saidasData)
        
        return saidasData
        
      } catch (error) {
        console.error('💥 ERRO GERAL no hook useSaidas:', error)
        throw error
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Force fresh data every time
    gcTime: 0, // Force cache clear immediately
  })
}

export const useSaidaStats = () => {
  return useQuery({
    queryKey: ["saida-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saidas")
        .select("status, created_at")

      if (error) throw error

      const hoje = new Date().toDateString()
      const saidasHoje = data?.filter(s => 
        new Date(s.created_at).toDateString() === hoje
      ).length || 0

      const separacaoPendente = data?.filter(s => s.status === 'separacao_pendente').length || 0
      const expedidas = data?.filter(s => s.status === 'expedido').length || 0
      const entregues = data?.filter(s => s.status === 'entregue').length || 0

      return {
        saidasHoje,
        preparando: separacaoPendente,
        expedidas,
        entregues
      }
    },
  })
}