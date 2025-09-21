import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useCorrigirStatusSaida = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      remessaId, 
      saidaId 
    }: { 
      remessaId: string
      saidaId: string 
    }) => {
      // Update saida status to expedido
      const { error: saidaError } = await supabase
        .from("saidas")
        .update({ status: "expedido" })
        .eq("id", saidaId)

      if (saidaError) throw saidaError

      // Update remessa status to pronta
      const { error: remessaError } = await supabase
        .from("remessas")
        .update({ status: "pronta" })
        .eq("id", remessaId)

      if (remessaError) throw remessaError

      return { remessaId, saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Status corrigido",
        description: "O status da saída foi alterado para 'expedido' e a remessa para 'pronta'",
      })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
    },
    onError: (error) => {
      console.error("Erro ao corrigir status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível corrigir o status",
        variant: "destructive",
      })
    },
  })
}