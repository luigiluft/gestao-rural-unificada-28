import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

interface ContratoFranquiaData {
  numero_contrato: string
  franquia_id: string
  tipo_royalty: 'percentual_faturamento' | 'valor_fixo_mensal' | 'margem_por_servico'
  percentual_faturamento?: number
  valor_fixo_mensal?: number
  margens_servico?: any
  data_inicio: string
  data_fim?: string
  dia_vencimento: number
  status: 'ativo' | 'suspenso' | 'cancelado'
  observacoes?: string
}

export const useCreateContratoFranquia = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: ContratoFranquiaData) => {
      const { data: result, error } = await supabase
        .from("contrato_franquia")
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos-franquia"] })
      toast.success("Contrato criado com sucesso!")
      navigate("/contratos-franquias")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar contrato")
    },
  })
}

export const useUpdateContratoFranquia = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContratoFranquiaData> }) => {
      const { data: result, error } = await supabase
        .from("contrato_franquia")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos-franquia"] })
      toast.success("Contrato atualizado com sucesso!")
      navigate("/contratos-franquias")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar contrato")
    },
  })
}
