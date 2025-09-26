import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UpdateViagemDataParams {
  viagemId: string
  data_inicio?: string
  data_fim?: string
}

export const useUpdateViagemData = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId, data_inicio, data_fim }: UpdateViagemDataParams) => {
      const updateData: any = {}
      if (data_inicio) updateData.data_inicio = data_inicio
      if (data_fim) updateData.data_fim = data_fim

      const { error } = await supabase
        .from("viagens")
        .update(updateData)
        .eq("id", viagemId)

      if (error) throw error

      return { viagemId, data_inicio, data_fim }
    },
    onSuccess: () => {
      toast({
        title: "Data atualizada",
        description: "A data de entrega da viagem foi atualizada com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
    },
    onError: (error) => {
      console.error("Erro ao atualizar data da viagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a data da viagem",
        variant: "destructive",
      })
    },
  })
}