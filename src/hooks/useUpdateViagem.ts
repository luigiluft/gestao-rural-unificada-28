import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface UpdateViagemPayload {
  id: string
  numero?: string
  data_inicio?: string | null
  data_fim?: string | null
  observacoes?: string | null
  motorista_id?: string | null
}

export const useUpdateViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (payload: UpdateViagemPayload) => {
      const { id, ...fields } = payload
      const { error } = await supabase
        .from("viagens")
        .update({
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["motorista-viagens"] })
      toast({ title: "Viagem atualizada", description: "Registro atualizado com sucesso." })
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar viagem:", error)
      toast({ title: "Erro", description: "Não foi possível atualizar a viagem.", variant: "destructive" })
    }
  })
}
