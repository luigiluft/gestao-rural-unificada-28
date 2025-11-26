import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useMotoristaNotifications } from "./useMotoristaNotifications"
import { useDepositoFilter } from "./useDepositoFilter"

export const useNotifications = () => {
  const { user } = useAuth()
  const { data: motoristaNotifications = 0 } = useMotoristaNotifications()
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["notifications", user?.id, depositoId],
    queryFn: async () => {
      if (!user?.id) return {
        recebimento: 0,
        estoque: 0,
        alocacoes: 0,
        separacao: 0,
        expedicao: 0,
        remessas: 0,
        suporte: 0,
        subcontas: 0,
        viagens: 0,
        posicoes: 0,
        divergencias: 0,
        ocorrencias: 0,
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const isAdmin = profile?.role === 'admin'
      const isOperador = profile?.role === 'operador'
      const isCliente = profile?.role === 'cliente'

      let recebimento = 0
      let estoque = 0
      let alocacoes = 0
      let separacao = 0
      let expedicao = 0
      let remessas = 0
      let suporte = 0
      let subcontas = 0
      let viagens = 0
      let posicoes = 0
      let divergencias = 0
      let ocorrencias = 0

      try {
        // RECEBIMENTO: For operadores - entradas nos 4 status da página recebimento
        if (isOperador || isAdmin) {
          let entradasQuery = supabase
            .from("entradas")
            .select("id", { count: "exact" })
            .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "planejamento"])

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            entradasQuery = entradasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
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

        // Count allocated pallets since last view as estoque indicator
        const { count: estoqueCount } = await supabase
          .from("pallet_positions")
          .select("id", { count: "exact" })
          .eq("status", "alocado")
          .gte("alocado_em", lastViewTime)

        estoque = estoqueCount || 0

        // POSIÇÕES: For operadores and admins - pallets alocados since last view
        if (isOperador || isAdmin) {
          const { data: lastViewPosicoes } = await supabase
            .from("user_notification_views")
            .select("last_viewed_at")
            .eq("user_id", user.id)
            .eq("notification_type", "posicoes")
            .single()

          const lastViewTimePosicoes = lastViewPosicoes?.last_viewed_at || '1970-01-01T00:00:00Z'

          let posicoesQuery = supabase
            .from("pallet_positions")
            .select("id", { count: "exact" })
            .eq("status", "alocado")
            .gte("alocado_em", lastViewTimePosicoes)

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            const { data: positions } = await supabase
              .from("storage_positions")
              .select("id")
              .eq("deposito_id", depositoId)
            
            const positionIds = positions?.map(p => p.id) || []
            if (positionIds.length > 0) {
              posicoesQuery = posicoesQuery.in("posicao_id", positionIds)
            }
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              // Need to join with storage_positions to filter by deposito
              const { data: positions } = await supabase
                .from("storage_positions")
                .select("id")
                .in("deposito_id", franquiaIds)
              
              const positionIds = positions?.map(p => p.id) || []
              if (positionIds.length > 0) {
                posicoesQuery = posicoesQuery.in("posicao_id", positionIds)
              }
            }
          }

          const { count: posicoesCount } = await posicoesQuery
          posicoes = posicoesCount || 0
        }

        // ALOCAÇÕES: For operadores - pending pallets for allocation
        if (isOperador || isAdmin) {
          // Count pallets pending allocation
          let pendingPalletsQuery = supabase
            .from("entrada_pallets")
            .select(`
              id,
              entradas!inner (
                deposito_id,
                status_aprovacao
              )
            `, { count: "exact" })
            .eq("entradas.status_aprovacao", "confirmado")

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            pendingPalletsQuery = pendingPalletsQuery.eq("entradas.deposito_id", depositoId)
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              pendingPalletsQuery = pendingPalletsQuery.in("entradas.deposito_id", franquiaIds)
            }
          }

          // Filter out already allocated pallets
          const { data: allPallets } = await pendingPalletsQuery
          const { data: allocatedPalletIds } = await supabase
            .from("pallet_positions")
            .select("pallet_id")
            .eq("status", "alocado")

          const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || [])
          const pendingPallets = allPallets?.filter(pallet => !allocatedIds.has(pallet.id)) || []
          alocacoes = pendingPallets.length
        }

        // SEPARAÇÃO: For operadores - saídas pending separation only
        if (isOperador || isAdmin) {
          let separacaoQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "separacao_pendente")

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            separacaoQuery = separacaoQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
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

        // EXPEDIÇÃO: For operadores - saídas pending expedition (only separated items)
        if (isOperador || isAdmin) {
          let saidasQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "separado")

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            saidasQuery = saidasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
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

        // REMESSAS: For operadores - saidas expedidas pending trip planning
        if (isOperador || isAdmin) {
          let remessasQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "expedido")
            .is("viagem_id", null) // Only saídas that are not allocated to trips

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            remessasQuery = remessasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              remessasQuery = remessasQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: remessasCount } = await remessasQuery
          remessas = remessasCount || 0
        }

        // VIAGENS: For operadores - planned/pending trips in their deposits
        if (isOperador || isAdmin) {
          let viagensQuery = supabase
            .from("viagens")
            .select("id", { count: "exact" })
            .in("status", ["planejada", "pendente"])

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            viagensQuery = viagensQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              viagensQuery = viagensQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: viagensCount } = await viagensQuery
          viagens = viagensCount || 0
        }

        // SUPORTE: Open support tickets for current user
        const { count: suporteCount } = await supabase
          .from("chamados_suporte")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "aberto")

        suporte = suporteCount || 0

        // SUBCONTAS: For admins and operadores - recent pending invites (last 30 days)
        if (isAdmin || isOperador) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          
          let subcountQuery = supabase
            .from("pending_invites")
            .select("id", { count: "exact" })
            .is("used_at", null)
            .gte("created_at", thirtyDaysAgo) // Only count recent invites

          if (!isAdmin) {
            subcountQuery = subcountQuery.eq("inviter_user_id", user.id)
          }

          const { count: subcountasCount } = await subcountQuery
          subcontas = subcountasCount || 0
        }

        // DIVERGÊNCIAS: For operadores and admins - divergencias not in final status (resolvida/cancelada)
        if (isOperador || isAdmin) {
          let divergenciasQuery = supabase
            .from("divergencias")
            .select("id, deposito_id", { count: "exact" })
            .not("status", "in", '("resolvida","cancelada")')

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            divergenciasQuery = divergenciasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              divergenciasQuery = divergenciasQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: divergenciasCount } = await divergenciasQuery
          divergencias = divergenciasCount || 0
        }

        // OCORRÊNCIAS: For operadores and admins - ocorrencias not in final status (resolvida/cancelada)
        if (isOperador || isAdmin) {
          let ocorrenciasQuery = supabase
            .from("ocorrencias")
            .select("id, deposito_id", { count: "exact" })
            .not("status", "in", '("resolvida","cancelada")')

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            ocorrenciasQuery = ocorrenciasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin) {
            // Filter by franquias owned by this franqueado
            const { data: franquias } = await supabase
              .from("franquias")
              .select("id")
              .eq("master_franqueado_id", user.id)
            
            const franquiaIds = franquias?.map(f => f.id) || []
            if (franquiaIds.length > 0) {
              ocorrenciasQuery = ocorrenciasQuery.in("deposito_id", franquiaIds)
            }
          }

          const { count: ocorrenciasCount } = await ocorrenciasQuery
          ocorrencias = ocorrenciasCount || 0
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
        remessas,
        suporte,
        subcontas,
        viagens: viagens + motoristaNotifications, // Combine franqueado trips + motorista trips
        posicoes,
        divergencias,
        ocorrencias,
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  })
}