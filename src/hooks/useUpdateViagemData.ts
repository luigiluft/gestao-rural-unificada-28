import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { Json } from "@/integrations/supabase/types"

interface UpdateViagemDataParams {
  id?: string
  viagemId?: string // Alias for id
  status?: string
  data_inicio?: string | null
  data_fim?: string | null
  previsao_inicio?: string | null
  paradas?: Record<string, unknown>[]
  pod?: Record<string, unknown>
  ocorrencias_viagem?: Record<string, unknown>[]
  frete_id?: string | null
  tipo_execucao?: string | null
  motorista_id?: string | null
  veiculo_id?: string | null
  observacoes?: string | null
}

export const useUpdateViagemData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateViagemDataParams) => {
      const { id, viagemId, ...data } = params
      const actualId = id || viagemId
      if (!actualId) throw new Error("ID da viagem é obrigatório")
      
      const updateData: Record<string, unknown> = {}

      if (data.status !== undefined) updateData.status = data.status
      if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio
      if (data.data_fim !== undefined) updateData.data_fim = data.data_fim
      if (data.previsao_inicio !== undefined) updateData.previsao_inicio = data.previsao_inicio
      if (data.paradas !== undefined) updateData.paradas = data.paradas as Json
      if (data.pod !== undefined) updateData.pod = data.pod as Json
      if (data.ocorrencias_viagem !== undefined) updateData.ocorrencias_viagem = data.ocorrencias_viagem as Json
      if (data.frete_id !== undefined) updateData.frete_id = data.frete_id
      if (data.tipo_execucao !== undefined) updateData.tipo_execucao = data.tipo_execucao
      if (data.motorista_id !== undefined) updateData.motorista_id = data.motorista_id
      if (data.veiculo_id !== undefined) updateData.veiculo_id = data.veiculo_id
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes

      const { data: result, error } = await supabase
        .from("viagens")
        .update(updateData)
        .eq("id", actualId)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagem"] })
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar viagem: " + error.message)
    },
  })
}
