import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useAlocarRemessa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ viagemId, remessaId, ordemEntrega }: { 
      viagemId: string
      remessaId: string
      ordemEntrega?: number 
    }) => {
      const { data, error } = await supabase
        .from("viagem_remessas")
        .insert({
          viagem_id: viagemId,
          remessa_id: remessaId,
          ordem_entrega: ordemEntrega
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      toast.success("Remessa alocada à viagem com sucesso!")
    },
    onError: (error: any) => {
      toast.error("Erro ao alocar remessa à viagem: " + error.message)
    },
  })
}

export const useDesalocarRemessa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ viagemId, remessaId }: { 
      viagemId: string
      remessaId: string 
    }) => {
      const { error } = await supabase
        .from("viagem_remessas")
        .delete()
        .eq("viagem_id", viagemId)
        .eq("remessa_id", remessaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      toast.success("Remessa removida da viagem com sucesso!")
    },
    onError: (error: any) => {
      toast.error("Erro ao remover remessa da viagem: " + error.message)
    },
  })
}

export const useReordenarRemessas = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ viagemId, remessasOrdem }: { 
      viagemId: string
      remessasOrdem: { remessaId: string; ordemEntrega: number }[]
    }) => {
      const updates = remessasOrdem.map(({ remessaId, ordemEntrega }) =>
        supabase
          .from("viagem_remessas")
          .update({ ordem_entrega: ordemEntrega })
          .eq("viagem_id", viagemId)
          .eq("remessa_id", remessaId)
      )

      const results = await Promise.all(updates)
      
      for (const result of results) {
        if (result.error) throw result.error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      toast.success("Ordem de entrega das remessas atualizada!")
    },
    onError: (error: any) => {
      toast.error("Erro ao reordenar remessas: " + error.message)
    },
  })
}