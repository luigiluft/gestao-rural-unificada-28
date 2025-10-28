import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { ContratoFormData } from "@/lib/validations/contrato.schemas"

export const useContratoMutations = () => {
  const queryClient = useQueryClient()

  const createContrato = useMutation({
    mutationFn: async (data: ContratoFormData) => {
      const insertData = {
        numero_contrato: data.numero_contrato,
        franquia_id: data.franquia_id,
        produtor_id: data.produtor_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        dia_vencimento: data.dia_vencimento,
        tipo_cobranca: data.tipo_cobranca,
        observacoes: data.observacoes || null,
        status: data.status,
      }
      
      const { data: contrato, error } = await supabase
        .from('contratos_servico')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      return contrato
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      toast.success('Contrato criado com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao criar contrato: ' + error.message)
    },
  })

  const updateContrato = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoFormData> }) => {
      const { data: contrato, error } = await supabase
        .from('contratos_servico')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return contrato
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['contrato'] })
      toast.success('Contrato atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao atualizar contrato: ' + error.message)
    },
  })

  const cancelContrato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contratos_servico')
        .update({ status: 'cancelado' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['contrato'] })
      toast.success('Contrato cancelado com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao cancelar contrato: ' + error.message)
    },
  })

  return {
    createContrato,
    updateContrato,
    cancelContrato,
  }
}
