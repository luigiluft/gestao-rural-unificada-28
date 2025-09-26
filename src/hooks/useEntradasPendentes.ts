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
          console.error('❌ Error fetching entradas:', error)
          throw error
        }

        console.log(`📦 Found ${entradas?.length || 0} entradas`)
        
        if (!entradas || entradas.length === 0) {
          console.log('⚠️ No entradas found')
          return []
        }

        // Fetch related data separately
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

        // Enrich entradas with related data
        const enrichedEntradas = entradas.map(entrada => ({
          ...entrada,
          profiles: entrada.user_id ? profilesMap.get(entrada.user_id) : null,
          fornecedores: entrada.fornecedor_id ? fornecedoresMap.get(entrada.fornecedor_id) : null,
          franquias: entrada.deposito_id ? franquiasMap.get(entrada.deposito_id) : null
        }))

        console.log('✅ Entradas loaded with related data')
        return enrichedEntradas
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
        id: entradaId,
        status_aprovacao: novoStatus,
      }

      if (observacoes) {
        updateData.observacoes_franqueado = observacoes
      }

      if (divergencias && divergencias.length > 0) {
        updateData.divergencias = divergencias
      }

      const { data, error } = await supabase.functions.invoke('manage-entradas', {
        body: {
          action: 'update_status',
          data: updateData
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar status da entrada')
      }

      return { entradaId, novoStatus }
    },
    onSuccess: (data) => {
      // Invalidate multiple query keys to refresh all related data
      queryClient.invalidateQueries({ queryKey: ["entradas-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["entradas"] })
      queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      
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