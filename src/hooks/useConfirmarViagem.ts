import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useConfirmarViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId }: { viagemId: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-viagens', {
        body: {
          action: 'confirm',
          data: { viagemId }
        }
      })

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao confirmar viagem')
      }

      return data.data
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