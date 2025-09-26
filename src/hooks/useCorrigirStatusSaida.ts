import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useCorrigirStatusSaida = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      saidaId 
    }: { 
      saidaId: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-saidas', {
        body: {
          action: 'update_status',
          data: {
            id: saidaId,
            status: "expedido"
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao corrigir status da saída')
      }

      return { saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Status corrigido",
        description: "O status da saída foi alterado para 'expedido'",
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