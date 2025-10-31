import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useAtualizarFatura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contratoId: string) => {
      const { data, error } = await supabase.functions.invoke("gerar-fatura", {
        body: { contrato_id: contratoId },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] })
      queryClient.invalidateQueries({ queryKey: ["fatura-itens"] })
      toast.success("Fatura atualizada com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar fatura")
    },
  })
}
