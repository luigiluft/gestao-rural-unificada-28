import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useConfirmarViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId }: { viagemId: string }) => {
      // Update viagem status to 'em_andamento'
      const { error } = await supabase
        .from("viagens")
        .update({ 
          status: "em_andamento"
        })
        .eq("id", viagemId)

      if (error) throw error
      return { viagemId }
    },
    onSuccess: () => {
      toast({
        title: "Viagem confirmada",
        description: "A viagem foi confirmada e está agora em andamento",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-com-remessas"] })
    },
    onError: (error) => {
      console.error("Erro ao confirmar viagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a viagem",
        variant: "destructive",
      })
    },
  })
}