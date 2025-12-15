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
      const isCliente = profile?.role === 'cliente'

      // Get client modules if cliente
      let wmsHabilitado = false
      let tmsHabilitado = false
      
      if (isCliente) {
        const { data: clienteUsuario } = await supabase
          .from("cliente_usuarios")
          .select("cliente_id")
          .eq("user_id", user.id)
          .eq("ativo", true)
          .maybeSingle()
        
        if (clienteUsuario?.cliente_id) {
          const { data: cliente } = await supabase
            .from("clientes")
            .select("wms_habilitado, tms_habilitado")
            .eq("id", clienteUsuario.cliente_id)
            .single()
          
          wmsHabilitado = cliente?.wms_habilitado || false
          tmsHabilitado = cliente?.tms_habilitado || false
        }
      }

      // Check if user has franchise associations (for deposit-based operations)
      const { data: franquiaUsuarios } = await supabase
        .from("franquia_usuarios")
        .select("franquia_id")
        .eq("user_id", user.id)
        .eq("ativo", true)
      
      const hasFranchiseAccess = isAdmin || (franquiaUsuarios && franquiaUsuarios.length > 0)
      const canAccessWMS = isAdmin || wmsHabilitado || hasFranchiseAccess
      const canAccessTMS = isAdmin || tmsHabilitado || hasFranchiseAccess

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
        // RECEBIMENTO: For users with WMS access - entradas nos 4 status da página recebimento
        if (canAccessWMS) {
          let entradasQuery = supabase
            .from("entradas")
            .select("id", { count: "exact" })
            .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "planejamento"])

          // Apply deposit filter if selected
          if (shouldFilter && depositoId) {
            entradasQuery = entradasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            entradasQuery = entradasQuery.in("deposito_id", franquiaIds)
          }

          const { count: entradasCount } = await entradasQuery
          recebimento = entradasCount || 0
        }

        // ESTOQUE: For all users - completed allocation waves since last view
        const { data: lastView } = await supabase
          .from("user_notification_views")
          .select("last_viewed_at")
          .eq("user_id", user.id)
          .eq("notification_type", "estoque")
          .single()

        const lastViewTime = lastView?.last_viewed_at || '1970-01-01T00:00:00Z'

        const { count: estoqueCount } = await supabase
          .from("pallet_positions")
          .select("id", { count: "exact" })
          .eq("status", "alocado")
          .gte("alocado_em", lastViewTime)

        estoque = estoqueCount || 0

        // POSIÇÕES: For users with WMS access - pallets alocados since last view
        if (canAccessWMS) {
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

          if (shouldFilter && depositoId) {
            const { data: positions } = await supabase
              .from("storage_positions")
              .select("id")
              .eq("deposito_id", depositoId)
            
            const positionIds = positions?.map(p => p.id) || []
            if (positionIds.length > 0) {
              posicoesQuery = posicoesQuery.in("posicao_id", positionIds)
            }
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            const { data: positions } = await supabase
              .from("storage_positions")
              .select("id")
              .in("deposito_id", franquiaIds)
            
            const positionIds = positions?.map(p => p.id) || []
            if (positionIds.length > 0) {
              posicoesQuery = posicoesQuery.in("posicao_id", positionIds)
            }
          }

          const { count: posicoesCount } = await posicoesQuery
          posicoes = posicoesCount || 0
        }

        // ALOCAÇÕES: For users with WMS access - pending pallets for allocation
        if (canAccessWMS) {
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

          if (shouldFilter && depositoId) {
            pendingPalletsQuery = pendingPalletsQuery.eq("entradas.deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            pendingPalletsQuery = pendingPalletsQuery.in("entradas.deposito_id", franquiaIds)
          }

          const { data: allPallets } = await pendingPalletsQuery
          const { data: allocatedPalletIds } = await supabase
            .from("pallet_positions")
            .select("pallet_id")
            .eq("status", "alocado")

          const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || [])
          const pendingPallets = allPallets?.filter(pallet => !allocatedIds.has(pallet.id)) || []
          alocacoes = pendingPallets.length
        }

        // SEPARAÇÃO: For users with WMS access - saídas pending separation only
        if (canAccessWMS) {
          let separacaoQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "separacao_pendente")

          if (shouldFilter && depositoId) {
            separacaoQuery = separacaoQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            separacaoQuery = separacaoQuery.in("deposito_id", franquiaIds)
          }

          const { count: separacaoCount } = await separacaoQuery
          separacao = separacaoCount || 0
        }

        // EXPEDIÇÃO: For users with WMS access - saídas pending expedition
        if (canAccessWMS) {
          let saidasQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "separado")

          if (shouldFilter && depositoId) {
            saidasQuery = saidasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            saidasQuery = saidasQuery.in("deposito_id", franquiaIds)
          }

          const { count: saidasCount } = await saidasQuery
          expedicao = saidasCount || 0
        }

        // REMESSAS: For users with TMS access - saidas expedidas pending trip planning
        if (canAccessTMS) {
          let remessasQuery = supabase
            .from("saidas")
            .select("id", { count: "exact" })
            .eq("status", "expedido")
            .is("viagem_id", null)

          if (shouldFilter && depositoId) {
            remessasQuery = remessasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            remessasQuery = remessasQuery.in("deposito_id", franquiaIds)
          }

          const { count: remessasCount } = await remessasQuery
          remessas = remessasCount || 0
        }

        // VIAGENS: For users with TMS access - planned/pending trips
        if (canAccessTMS) {
          let viagensQuery = supabase
            .from("viagens")
            .select("id", { count: "exact" })
            .in("status", ["planejada", "pendente"])

          if (shouldFilter && depositoId) {
            viagensQuery = viagensQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            viagensQuery = viagensQuery.in("deposito_id", franquiaIds)
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

        // SUBCONTAS: For admins and users with franchise access - recent pending invites
        if (isAdmin || hasFranchiseAccess) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          
          let subcountQuery = supabase
            .from("pending_invites")
            .select("id", { count: "exact" })
            .is("used_at", null)
            .gte("created_at", thirtyDaysAgo)

          if (!isAdmin) {
            subcountQuery = subcountQuery.eq("inviter_user_id", user.id)
          }

          const { count: subcountasCount } = await subcountQuery
          subcontas = subcountasCount || 0
        }

        // DIVERGÊNCIAS: For users with WMS access - divergencias not in final status
        if (canAccessWMS) {
          let divergenciasQuery = supabase
            .from("divergencias")
            .select("id, deposito_id", { count: "exact" })
            .not("status", "in", '("resolvida","cancelada")')

          if (shouldFilter && depositoId) {
            divergenciasQuery = divergenciasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            divergenciasQuery = divergenciasQuery.in("deposito_id", franquiaIds)
          }

          const { count: divergenciasCount } = await divergenciasQuery
          divergencias = divergenciasCount || 0
        }

        // OCORRÊNCIAS: For users with TMS access - ocorrencias not in final status
        if (canAccessTMS) {
          let ocorrenciasQuery = supabase
            .from("ocorrencias")
            .select("id, deposito_id", { count: "exact" })
            .not("status", "in", '("resolvida","cancelada")')

          if (shouldFilter && depositoId) {
            ocorrenciasQuery = ocorrenciasQuery.eq("deposito_id", depositoId)
          } else if (!isAdmin && franquiaUsuarios && franquiaUsuarios.length > 0) {
            const franquiaIds = franquiaUsuarios.map(f => f.franquia_id)
            ocorrenciasQuery = ocorrenciasQuery.in("deposito_id", franquiaIds)
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
        viagens: viagens + motoristaNotifications,
        posicoes,
        divergencias,
        ocorrencias,
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute - prevents refetching if data is fresh
    gcTime: 300000, // 5 minutes - keep in cache longer
    refetchInterval: 120000, // 2 minutes instead of 30s to reduce DB load
    refetchOnWindowFocus: false, // Disable to prevent unnecessary refetches
  })
}
