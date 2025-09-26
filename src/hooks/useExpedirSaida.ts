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
      const { data, error } = await supabase.functions.invoke('manage-saidas', {
        body: {
          action: 'update_status',
          data: {
            id: saidaId,
            status: "expedido",
            observacoes: observacoes || null
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao expedir saída')
      }

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