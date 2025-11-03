import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useGerarRoyalty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ franquia_id, contrato_franquia_id }: { franquia_id?: string; contrato_franquia_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("gerar-royalty", {
        body: { franquia_id, contrato_franquia_id },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["royalties"] })
      queryClient.invalidateQueries({ queryKey: ["royalty-itens"] })
      toast.success("Royalty gerado/atualizado com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar royalty")
    },
  })
}
