import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Json } from "@/integrations/supabase/types"

export interface FreteFinanceiro {
  id: string
  frete_id: string
  tipo: 'RECEITA' | 'DESPESA'
  descricao: string | null
  valor: number
  data_vencimento: string | null
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'cancelado'
  conta_receber_id: string | null
  conta_pagar_id: string | null
  beneficiario_tipo: 'AGREGADO' | 'TRANSPORTADORA' | null
  beneficiario_id: string | null
  beneficiario_nome: string | null
  beneficiario_cpf_cnpj: string | null
  beneficiario_dados_bancarios: Record<string, unknown> | null
  observacoes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export const useFreteFinanceiro = (freteId?: string) => {
  return useQuery({
    queryKey: ["frete-financeiro", freteId],
    queryFn: async () => {
      let query = supabase
        .from("frete_financeiro")
        .select("*")
        .order("created_at", { ascending: false })

      if (freteId) {
        query = query.eq("frete_id", freteId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as FreteFinanceiro[]
    },
    enabled: true,
  })
}

export const useFreteFinanceiroByFrete = (freteId: string) => {
  return useQuery({
    queryKey: ["frete-financeiro", "frete", freteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frete_financeiro")
        .select("*")
        .eq("frete_id", freteId)
        .order("tipo", { ascending: true })

      if (error) throw error
      return data as FreteFinanceiro[]
    },
    enabled: !!freteId,
  })
}

export const useUpdateFreteFinanceiro = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, beneficiario_dados_bancarios, ...data }: Partial<FreteFinanceiro> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data }
      if (beneficiario_dados_bancarios !== undefined) {
        updateData.beneficiario_dados_bancarios = beneficiario_dados_bancarios as Json | null
      }
      
      const { error } = await supabase
        .from("frete_financeiro")
        .update(updateData)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frete-financeiro"] })
      toast({
        title: "Registro atualizado",
        description: "Registro financeiro atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar registro financeiro:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro financeiro",
        variant: "destructive",
      })
    },
  })
}

export const useMarcarPago = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data_pagamento }: { id: string; data_pagamento?: string }) => {
      const { error } = await supabase
        .from("frete_financeiro")
        .update({
          status: 'pago',
          data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frete-financeiro"] })
      queryClient.invalidateQueries({ queryKey: ["fretes"] })
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso",
      })
    },
    onError: (error) => {
      console.error("Erro ao registrar pagamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      })
    },
  })
}
