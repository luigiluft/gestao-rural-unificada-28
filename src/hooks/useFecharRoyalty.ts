import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useFecharRoyalty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (royaltyId: string) => {
      const { data, error } = await supabase.functions.invoke("fechar-royalty", {
        body: { royalty_id: royaltyId },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["royalties"] })
      toast.success("Royalty fechado com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fechar royalty")
    },
  })
}
