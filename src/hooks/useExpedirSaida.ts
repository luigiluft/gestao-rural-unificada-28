import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useExpedirSaida = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      saidaId, 
      observacoes 
    }: { 
      saidaId: string
      observacoes?: string 
    }) => {
      // Update saida status to expedido
      const { error: updateError } = await supabase
        .from("saidas")
        .update({
          status: "expedido",
          observacoes: observacoes || null
        })
        .eq("id", saidaId)

      if (updateError) throw updateError

      return { saidaId }
    },
    onSuccess: (data) => {
      toast({
        title: "Saída expedida",
        description: "A saída foi expedida com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
    },
    onError: (error) => {
      console.error("Erro ao expedir saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível expedir a saída",
        variant: "destructive",
      })
    },
  })
}