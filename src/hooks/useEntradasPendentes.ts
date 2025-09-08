import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DateRange {
  from?: Date
  to?: Date
}

export const useEntradasPendentes = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["entradas-pendentes", dateRange],
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        console.log('🔍 Fetching entradas pendentes...')
        let query = supabase
          .from("entradas")
          .select(`
            *,
            entrada_itens(
              *,
              produtos(nome, unidade_medida)
            )
          `)
          .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "planejamento"])
          
        // Apply date filters if provided
        if (dateRange?.from) {
          query = query.gte("data_entrada", dateRange.from.toISOString().split('T')[0])
        }
        if (dateRange?.to) {
          query = query.lte("data_entrada", dateRange.to.toISOString().split('T')[0])
        }
        
        const { data: entradas, error } = await query.order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        console.log(`📦 Found ${entradas?.length || 0} entradas`)
        
        if (!entradas || entradas.length === 0) {
          console.log('⚠️ No entradas found')
          return []
        }

        // Log entrada_itens for debugging
        entradas.forEach((entrada, index) => {
          console.log(`Entrada ${index + 1} (${entrada.numero_nfe}):`, {
            id: entrada.id,
            status: entrada.status_aprovacao,
            entrada_itens_count: entrada.entrada_itens?.length || 0,
            entrada_itens: entrada.entrada_itens
          })
        })

        // Optimize: Get unique IDs for batch fetching
        const userIds = [...new Set(entradas.map(e => e.user_id).filter(Boolean))]
        const fornecedorIds = [...new Set(entradas.map(e => e.fornecedor_id).filter(Boolean))]
        const depositoIds = [...new Set(entradas.map(e => e.deposito_id).filter(Boolean))]
        
        // Batch fetch profiles
        let profilesMap = new Map()
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, nome")
            .in("user_id", userIds)
          
          profiles?.forEach(p => profilesMap.set(p.user_id, p))
        }
        
        // Batch fetch fornecedores
        let fornecedoresMap = new Map()
        if (fornecedorIds.length > 0) {
          const { data: fornecedores } = await supabase
            .from("fornecedores")
            .select("id, nome")
            .in("id", fornecedorIds)
          
          fornecedores?.forEach(f => fornecedoresMap.set(f.id, f))
        }
        
        // Batch fetch franquias
        let franquiasMap = new Map()
        if (depositoIds.length > 0) {
          const { data: franquias } = await supabase
            .from("franquias")
            .select("id, nome")
            .in("id", depositoIds)
          
          franquias?.forEach(f => franquiasMap.set(f.id, f))
        }

        // Map enriched data to entradas
        const entradasEnriquecidas = entradas.map((entrada) => {
          const enrichedEntry: any = { ...entrada }

          // Add profile data
          if (entrada.user_id) {
            enrichedEntry.profiles = profilesMap.get(entrada.user_id) || null
          }

          // Add fornecedor data
          if (entrada.fornecedor_id) {
            enrichedEntry.fornecedores = fornecedoresMap.get(entrada.fornecedor_id) || null
          }

          // Add franquia data
          if (entrada.deposito_id) {
            enrichedEntry.franquias = franquiasMap.get(entrada.deposito_id) || null
          }

          return enrichedEntry
        })

        console.log('✅ Entradas enriched successfully')
        return entradasEnriquecidas || []
      } catch (error) {
        throw error
      }
    },
    refetchOnMount: true,
  })
}

export const useAtualizarStatusEntrada = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      entradaId, 
      novoStatus, 
      observacoes,
      divergencias 
    }: { 
      entradaId: string, 
      novoStatus: string,
      observacoes?: string,
      divergencias?: any[]
    }) => {
      const updateData: any = {
        status_aprovacao: novoStatus,
      }

      if (observacoes) {
        updateData.observacoes_franqueado = observacoes
      }

      if (divergencias && divergencias.length > 0) {
        updateData.divergencias = divergencias
      }

      if (novoStatus === 'confirmado') {
        updateData.data_aprovacao = new Date().toISOString()
        const { data: userData } = await supabase.auth.getUser()
        updateData.aprovado_por = userData?.user?.id
      }

      const { data, error } = await supabase
        .from("entradas")
        .update(updateData)
        .eq("id", entradaId)
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum registro foi atualizado. Verifique se você tem permissão para editar esta entrada.')
      }

      return { entradaId, novoStatus }
    },
    onSuccess: async (data) => {
      // Invalidate specific queries with await to ensure they complete
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["entradas-pendentes"] }),
        queryClient.invalidateQueries({ queryKey: ["entradas"] }),
        queryClient.invalidateQueries({ queryKey: ["entrada-stats"] }),
      ])

      // Force refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ["entradas-pendentes"] })
      
      const statusMessages = {
        'em_transferencia': 'Entrada marcada como em transferência',
        'aguardando_conferencia': 'Entrada aguardando conferência',
        'planejamento': 'Conferência realizada - Entrada em planejamento',
        'confirmado': 'Entrada confirmada e adicionada ao estoque',
        'rejeitado': 'Entrada rejeitada'
      }
      
      const message = statusMessages[data?.novoStatus as keyof typeof statusMessages] || 'Status atualizado'
      
      toast({
        title: "Sucesso",
        description: message,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status da entrada",
        variant: "destructive",
      })
    },
  })
}