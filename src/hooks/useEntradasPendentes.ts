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
            ),
            profiles!user_id(nome),
            fornecedores(nome),
            franquias!deposito_id(nome)
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
        
        // Log detailed entry info
        entradas?.forEach((entrada, index) => {
          console.log(`📋 Entrada ${index + 1}:`, {
            id: entrada.id,
            numero_nfe: entrada.numero_nfe,
            status: entrada.status_aprovacao,
            user_id: entrada.user_id,
            deposito_id: entrada.deposito_id,
            entrada_itens_count: entrada.entrada_itens?.length || 0,
            has_profiles: !!entrada.profiles,
            has_fornecedores: !!entrada.fornecedores,
            has_franquias: !!entrada.franquias
          })
        })

        return entradas || []
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