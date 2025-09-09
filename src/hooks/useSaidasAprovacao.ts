import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export const useSaidasPendentesAprovacao = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["saidas-pendentes-aprovacao", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .eq("user_id", user.id)
        .eq("criado_por_franqueado", true)
        .eq("status_aprovacao_produtor", "pendente")
        .order("created_at", { ascending: false })

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
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes-aprovacao"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
      
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