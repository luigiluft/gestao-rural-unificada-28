import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useEntradasPendentes = () => {
  return useQuery({
    queryKey: ["entradas-pendentes"],
    queryFn: async () => {
      console.log('Fetching entradas pendentes...')
      
      // Check current user
      const { data: user, error: userError } = await supabase.auth.getUser()
      console.log('Current user:', user?.user?.id, user?.user?.email)
      
      if (userError) {
        console.error('User error:', userError)
        throw userError
      }
      const { data: entradas, error } = await supabase
        .from("entradas")
        .select(`
          *,
          fornecedores(nome),
          profiles!entradas_user_id_fkey(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .in("status_aprovacao", ["aguardando_transporte", "em_transferencia", "aguardando_conferencia", "conferencia_completa"])
        .order("created_at", { ascending: false })

      if (error) {
        console.error('Error fetching entradas:', error)
        throw error
      }

      console.log('Raw entradas fetched:', entradas?.length || 0, entradas)

      // Buscar nome da franquia para cada entrada
      const entradasComFranquias = await Promise.all(
        (entradas || []).map(async (entrada) => {
          if (entrada.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", entrada.deposito_id)
              .single()
            
            return {
              ...entrada,
              franquias: franquia
            }
          }
          return entrada
        })
      )

      return entradasComFranquias || []
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

      const { error } = await supabase
        .from("entradas")
        .update(updateData)
        .eq("id", entradaId)

      if (error) throw error

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