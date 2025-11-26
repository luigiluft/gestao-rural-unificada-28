import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useDepositoFilter } from "./useDepositoFilter"

export const useSaidasPendentesAprovacao = () => {
  const { user } = useAuth()
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["saidas-pendentes-aprovacao", user?.id, depositoId],
    queryFn: async () => {
      if (!user?.id) return []
      
      let query = supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .eq("produtor_destinatario_id", user.id)
        .eq("criado_por_franqueado", true)
        .eq("status_aprovacao_produtor", "pendente")
        .order("created_at", { ascending: false })
      
      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }
      
      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })
}

export const useAprovarSaida = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      saidaId, 
      aprovado, 
      observacoes 
    }: { 
      saidaId: string
      aprovado: boolean
      observacoes?: string 
    }) => {
      const { error } = await supabase
        .from("saidas")
        .update({
          status_aprovacao_produtor: aprovado ? "aprovado" : "reprovado",
          data_aprovacao_produtor: new Date().toISOString(),
          observacoes_aprovacao: observacoes,
        })
        .eq("id", saidaId)

      if (error) throw error
      
      // Movimentações de estoque serão criadas automaticamente pelos triggers do banco
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes-aprovacao"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
      queryClient.invalidateQueries({ queryKey: ["estoque"] })
      queryClient.invalidateQueries({ queryKey: ["saida-stats"] })
      
      // Force refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ["saidas"] })
      
      toast.success(
        variables.aprovado 
          ? "Saída aprovada com sucesso!" 
          : "Saída reprovada com sucesso!"
      )
    },
    onError: (error) => {
      console.error("Erro ao processar aprovação:", error)
      toast.error("Erro ao processar aprovação da saída")
    },
  })
}