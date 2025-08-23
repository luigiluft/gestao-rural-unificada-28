import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useNotifications = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        recebimento: 0,
        estoque: 0,
        alocacoes: 0,
        separacao: 0,
        expedicao: 0,
        suporte: 0,
        subcontas: 0,
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const isAdmin = profile?.role === 'admin'
      const isFranqueado = profile?.role === 'franqueado'
      const isProdutor = profile?.role === 'produtor'

      let recebimento = 0
      let estoque = 0
      let alocacoes = 0
      let separacao = 0
      let expedicao = 0
      let suporte = 0
      let subcontas = 0

      try {
        // RECEBIMENTO: For franqueados - entradas nos 4 status da página recebimento
        if (isFranqueado || isAdmin) {
          let entradasQuery = supabase
            .from("entradas")
            .select("id", { count: "exact" })
            .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "conferencia_completa"])

          if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              entradasQuery = entradasQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: entradasCount } = await entradasQuery
          recebimento = entradasCount || 0
        }

        // ESTOQUE: For all users - completed allocation waves since last view
        // Get user's last view time for estoque notifications
        const { data: lastView } = await supabase
          .from("user_notification_views")
          .select("last_viewed_at")
          .eq("user_id", user.id)
          .eq("notification_type", "estoque")
          .single()

        const lastViewTime = lastView?.last_viewed_at || '1970-01-01T00:00:00Z'

        // Count completed allocation waves since last view
        const { count: estoqueCount } = await supabase
          .from("allocation_waves")
          .select("id", { count: "exact" })
          .eq("status", "concluido")
          .gte("data_conclusao", lastViewTime)

        estoque = estoqueCount || 0

        // ALOCAÇÕES: For franqueados - allocation waves pending allocation
        if (isFranqueado || isAdmin) {
          let alocacoesQuery = supabase
            .from("allocation_waves")
            .select("id", { count: "exact" })
            .in("status", ["pendente", "posicoes_definidas"])

          if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              alocacoesQuery = alocacoesQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: alocacoesCount } = await alocacoesQuery
          alocacoes = alocacoesCount || 0
        }

        // SEPARAÇÃO: For franqueados - saídas pending separation and separated
        if (isFranqueado || isAdmin) {
          let separacaoQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .in("status", ["separacao_pendente", "separado"])

          if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              separacaoQuery = separacaoQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: separacaoCount } = await separacaoQuery
          separacao = separacaoCount || 0
        }

        // EXPEDIÇÃO: For franqueados - saídas pending expedition
        if (isFranqueado || isAdmin) {
          let saidasQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .in("status", ["separacao_pendente", "separado"])

          if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              saidasQuery = saidasQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: saidasCount } = await saidasQuery
          expedicao = saidasCount || 0
        }

        // SUPORTE: Open support tickets for current user
        const { count: suporteCount } = await supabase
          .from("chamados_suporte")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "aberto")

        suporte = suporteCount || 0

        // SUBCONTAS: For admins and franqueados - pending invites
        if (isAdmin || isFranqueado) {
          let subcountQuery = supabase
            .from("pending_invites")
            .select("id", { count: "exact" })
            .is("used_at", null)

          if (!isAdmin) {
            subcountQuery = subcountQuery.eq("inviter_user_id", user.id)
          }

          const { count: subcountasCount } = await subcountQuery
          subcontas = subcountasCount || 0
        }

      } catch (error) {
        console.error("Error fetching notifications:", error)
      }

      return {
        recebimento,
        estoque,
        alocacoes,
        separacao,
        expedicao,
        suporte,
        subcontas,
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  })
}