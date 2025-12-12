import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface CapacidadesTransporte {
  has_own_fleet: boolean
  can_aggregate: boolean
  can_collect: boolean
}

export const useClienteCapacidadesTransporte = () => {
  const { selectedCliente } = useCliente()

  return useQuery({
    queryKey: ["cliente-capacidades-transporte", selectedCliente?.id],
    queryFn: async (): Promise<CapacidadesTransporte> => {
      if (!selectedCliente?.id) {
        return {
          has_own_fleet: false,
          can_aggregate: false,
          can_collect: false,
        }
      }

      const { data, error } = await supabase
        .from("clientes")
        .select("has_own_fleet, can_aggregate, can_collect")
        .eq("id", selectedCliente.id)
        .single()

      if (error) {
        console.error("Erro ao buscar capacidades de transporte:", error)
        throw error
      }

      return {
        has_own_fleet: data?.has_own_fleet ?? false,
        can_aggregate: data?.can_aggregate ?? false,
        can_collect: data?.can_collect ?? false,
      }
    },
    enabled: !!selectedCliente?.id,
  })
}

export const useUpdateClienteCapacidadesTransporte = () => {
  const queryClient = useQueryClient()
  const { selectedCliente } = useCliente()

  return useMutation({
    mutationFn: async (capacidades: CapacidadesTransporte) => {
      if (!selectedCliente?.id) throw new Error("Nenhuma empresa selecionada")

      const { error } = await supabase
        .from("clientes")
        .update({
          has_own_fleet: capacidades.has_own_fleet,
          can_aggregate: capacidades.can_aggregate,
          can_collect: capacidades.can_collect,
        })
        .eq("id", selectedCliente.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-capacidades-transporte"] })
      toast.success("Capacidades de transporte atualizadas!")
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar capacidades: " + error.message)
    },
  })
}
