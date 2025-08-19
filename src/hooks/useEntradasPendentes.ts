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
    queryFn: async () => {
      console.log('🔍 Iniciando busca de entradas pendentes...')
      
      // Check current user first
      const { data: userData } = await supabase.auth.getUser()
      console.log('👤 Usuário atual:', userData?.user?.id, userData?.user?.email)

      // Get basic entries data first
      let query = supabase
        .from("entradas")
        .select(`
          *,
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "conferencia_completa"])
        
      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("data_entrada", dateRange.from.toISOString().split('T')[0])
      }
      if (dateRange?.to) {
        query = query.lte("data_entrada", dateRange.to.toISOString().split('T')[0])
      }
      
      const { data: entradas, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar entradas:', error)
        throw error
      }

      console.log('📊 Entradas encontradas:', entradas?.length || 0)
      console.log('📝 Detalhes das entradas:', entradas)

      if (!entradas || entradas.length === 0) {
        console.log('⚠️ Nenhuma entrada encontrada - verificando RLS políticas...')
        return []
      }

      // Enrich with additional data
      const entradasEnriquecidas = await Promise.all(
        entradas.map(async (entrada) => {
          const enrichedEntry: any = { ...entrada }

          // Get user profile
          if (entrada.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome")
              .eq("user_id", entrada.user_id)
              .single()
            
            enrichedEntry.profiles = profile
          }

          // Get supplier info
          if (entrada.fornecedor_id) {
            const { data: fornecedor } = await supabase
              .from("fornecedores")
              .select("nome")
              .eq("id", entrada.fornecedor_id)
              .single()
            
            enrichedEntry.fornecedores = fornecedor
          }

          // Get franchise info
          if (entrada.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", entrada.deposito_id)
              .single()
            
            enrichedEntry.franquias = franquia
          }

          return enrichedEntry
        })
      )

      console.log('✅ Entradas enriquecidas:', entradasEnriquecidas)
      return entradasEnriquecidas || []
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      console.log('🔄 Iniciando atualização de status:', { entradaId, novoStatus, observacoes, divergencias })

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
        updateData.aprovado_por = (await supabase.auth.getUser()).data.user?.id
      }

      console.log('📝 Dados para atualização:', updateData)

      const { data, error } = await supabase
        .from("entradas")
        .update(updateData)
        .eq("id", entradaId)
        .select()

      console.log('📊 Resultado da atualização:', { data, error })

      if (error) {
        console.error('❌ Erro na atualização:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum registro foi atualizado')
        throw new Error('Nenhum registro foi atualizado. Verifique se você tem permissão para editar esta entrada.')
      }

      console.log('✅ Status atualizado com sucesso:', data[0])
      return { entradaId, novoStatus }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["entradas-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["entradas"] })
      
      const statusMessages = {
        'em_transferencia': 'Entrada marcada como em transferência',
        'aguardando_conferencia': 'Entrada aguardando conferência',
        'conferencia_completa': 'Conferência realizada',
        'confirmado': 'Entrada confirmada e adicionada ao estoque',
        'rejeitado': 'Entrada rejeitada'
      }

      toast({
        title: "Status atualizado",
        description: statusMessages[data.novoStatus as keyof typeof statusMessages] || "Status da entrada atualizado com sucesso",
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