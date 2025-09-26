import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useConfirmarViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId }: { viagemId: string }) => {
      // Update viagem status to 'em_andamento'
      const { error: viagemError } = await supabase
        .from("viagens")
        .update({ 
          status: "em_andamento"
        })
        .eq("id", viagemId)

      if (viagemError) throw viagemError

      // Note: agendamentos table was removed from database
      // The viagem confirmation now only updates the viagem status
      
      const agendamentosCriados = 0 // No agendamentos created since table doesn't exist

      return { viagemId, agendamentosCriados }
    },
    onSuccess: (data) => {
      toast({
        title: "Viagem confirmada",
        description: "A viagem foi confirmada com sucesso",
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