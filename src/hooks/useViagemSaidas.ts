import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useAlocarSaidaViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      viagemId, 
      saidaId 
    }: { 
      viagemId: string
      saidaId: string 
    }) => {
      // Update saida to link to viagem and change status to em_transito
      const { error } = await supabase
        .from("saidas")
        .update({ 
          viagem_id: viagemId,
          status: "expedido" 
        })
        .eq("id", saidaId)

      if (error) throw error
      return { viagemId, saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Saída alocada",
        description: "A saída foi alocada à viagem com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
    },
    onError: (error) => {
      console.error("Erro ao alocar saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível alocar a saída à viagem",
        variant: "destructive",
      })
    },
  })
}

export const useDesalocarSaidaViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ saidaId }: { saidaId: string }) => {
      // Remove viagem link and change status back to expedido
      const { error } = await supabase
        .from("saidas")
        .update({ 
          viagem_id: null,
          status: "expedido" 
        })
        .eq("id", saidaId)

      if (error) throw error
      return { saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Saída desalocada",
        description: "A saída foi removida da viagem com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
    },
    onError: (error) => {
      console.error("Erro ao desalocar saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover a saída da viagem",
        variant: "destructive",
      })
    },
  })
}