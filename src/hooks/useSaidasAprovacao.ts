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
      
      // Se aprovado, processar a saída manualmente (criar movimentações)
      if (aprovado) {
        // Buscar itens da saída
        const { data: itens, error: itensError } = await supabase
          .from("saida_itens")
          .select("*")
          .eq("saida_id", saidaId)
        
        if (itensError) throw itensError
        
        // Criar movimentações de saída para cada item
        if (itens && itens.length > 0) {
          for (const item of itens) {
            const { error: movError } = await supabase
              .from("movimentacoes")
              .insert({
                user_id: item.user_id,
                produto_id: item.produto_id,
                deposito_id: null, // Será preenchido automaticamente
                tipo_movimentacao: "saida",
                quantidade: -item.quantidade, // Negativo para saída
                valor_unitario: item.valor_unitario,
                referencia_id: saidaId,
                referencia_tipo: "saida",
                lote: item.lote,
                observacoes: "Saída aprovada pelo produtor",
                data_movimentacao: new Date().toISOString()
              })
            
            if (movError) throw movError
          }
        }
      }
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