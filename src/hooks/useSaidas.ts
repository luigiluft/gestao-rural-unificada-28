import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useSaidas = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["saidas", dateRange],
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

        let query = supabase
          .from("saidas")
          .select(`
            *,
            saida_itens(
              *,
              produtos(nome, unidade_medida)
            )
          `)

        let saidasData: any[] = []

        // For producers, we need to handle two cases:
        // 1. Their own saídas (with date filter)
        // 2. Pending approval saídas from franchisees (always shown, regardless of date)
        if (userProfile?.role === 'produtor') {
          // First, get their own saídas with date filters
          let ownSaidasQuery = supabase
            .from("saidas")
            .select(`
              *,
              saida_itens(
                *,
                produtos(nome, unidade_medida)
              )
            `)
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

          // Second, get pending approval saídas from franchisees (no date filter)
          // Only show pending saídas, rejected ones should be hidden
          let pendingSaidasQuery = supabase
            .from("saidas")
            .select(`
              *,
              saida_itens(
                *,
                produtos(nome, unidade_medida)
              )
            `)
            .eq("criado_por_franqueado", true)
            .eq("produtor_destinatario_id", user.id)
            .eq("status_aprovacao_produtor", "pendente")

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

        // Para cada saída, buscar o nome da franquia, usuário criador e destinatário
        console.log('🏢 Iniciando busca de franquias, usuários e destinatários...')
        const saidasComDadosCompletos = await Promise.all(
          (saidasData || []).map(async (saida, index) => {
            console.log(`🔄 Processando saída ${index + 1}/${saidasData?.length}:`, saida.id)
            let depositoNome = null
            let usuarioNome = null
            let destinatarioNome = null

            // Buscar nome da franquia
            if (saida.deposito_id) {
              const { data: franquia } = await supabase
                .from("franquias")
                .select("nome")
                .eq("id", saida.deposito_id)
                .maybeSingle()

              if (franquia) {
                depositoNome = franquia.nome
              }
            }

            // Buscar nome do usuário criador
            if (saida.user_id) {
              const { data: usuario } = await supabase
                .from("profiles")
                .select("nome")
                .eq("user_id", saida.user_id)
                .maybeSingle()

              if (usuario) {
                usuarioNome = usuario.nome
              }
            }

            // Buscar nome do destinatário
            if (saida.produtor_destinatario_id) {
              const { data: destinatario } = await supabase
                .from("profiles")
                .select("nome")
                .eq("user_id", saida.produtor_destinatario_id)
                .maybeSingle()

              if (destinatario) {
                destinatarioNome = destinatario.nome
              }
            }

            console.log(`✅ Saída ${index + 1} processada - Depósito: ${depositoNome}, Criador: ${usuarioNome}, Destinatário: ${destinatarioNome}`)
            return {
              ...saida,
              depositos: depositoNome ? { nome: depositoNome } : null,
              profiles: usuarioNome ? { nome: usuarioNome } : null,
              produtor_destinatario: destinatarioNome ? { nome: destinatarioNome } : null
            }
          })
        )

        console.log('🎯 RESULTADO FINAL:')
        console.log('- Total de saídas processadas:', saidasComDadosCompletos.length)
        console.log('- Dados finais:', saidasComDadosCompletos)
        
        return saidasComDadosCompletos
        
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