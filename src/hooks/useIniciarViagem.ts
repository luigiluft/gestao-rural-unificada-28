import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface IniciarViagemParams {
  viagemId: string
}

export const useIniciarViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId }: IniciarViagemParams) => {
      const { error } = await supabase
        .from("viagens")
        .update({
          data_inicio: new Date().toISOString(),
          status: 'em_andamento'
        })
        .eq("id", viagemId)

      if (error) throw error

      return { viagemId }
    },
    onSuccess: () => {
      toast({
        title: "Viagem iniciada",
        description: "A viagem foi iniciada com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["motorista-viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["motorista-notifications"] })
    },
    onError: (error) => {
      console.error("Erro ao iniciar viagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a viagem",
        variant: "destructive",
      })
    },
  })
}
