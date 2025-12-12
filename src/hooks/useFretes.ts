import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Json } from "@/integrations/supabase/types"

export interface Frete {
  id: string
  cliente_id: string
  embarque_id: string
  executor_type: 'FROTA_PROPRIA' | 'AGREGADO' | 'TRANSPORTADORA_PARCEIRA'
  origin_type: 'BASE_PROPRIA' | 'COLETA'
  transportadora_parceira_id: string | null
  motorista_agregado_cpf: string | null
  motorista_agregado_nome: string | null
  motorista_agregado_dados_bancarios: Record<string, unknown> | null
  veiculo_id: string | null
  motorista_id: string | null
  tabela_frete_id: string | null
  preco_cobrado: number
  custo_frete: number
  margem_calculada: number
  sla_prazo_horas: number | null
  sla_prazo_data: string | null
  cte_id: string | null
  status: 'contratado' | 'em_execucao' | 'entregue' | 'faturado' | 'cancelado'
  observacoes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CreateFreteData {
  cliente_id: string
  embarque_id: string
  executor_type: 'FROTA_PROPRIA' | 'AGREGADO' | 'TRANSPORTADORA_PARCEIRA'
  origin_type?: 'BASE_PROPRIA' | 'COLETA'
  transportadora_parceira_id?: string | null
  motorista_agregado_cpf?: string | null
  motorista_agregado_nome?: string | null
  motorista_agregado_dados_bancarios?: Record<string, unknown> | null
  veiculo_id?: string | null
  motorista_id?: string | null
  tabela_frete_id?: string | null
  preco_cobrado: number
  custo_frete: number
  sla_prazo_horas?: number | null
  sla_prazo_data?: string | null
  observacoes?: string | null
}

export const useFretes = (clienteId?: string) => {
  return useQuery({
    queryKey: ["fretes", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("fretes")
        .select("*")
        .order("created_at", { ascending: false })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Frete[]
    },
    enabled: true,
  })
}

export const useFretesByEmbarque = (embarqueId: string) => {
  return useQuery({
    queryKey: ["fretes", "embarque", embarqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fretes")
        .select("*")
        .eq("embarque_id", embarqueId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Frete[]
    },
    enabled: !!embarqueId,
  })
}

export const useCreateFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateFreteData) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { motorista_agregado_dados_bancarios, ...rest } = data
      
      const { data: frete, error } = await supabase
        .from("fretes")
        .insert({
          ...rest,
          motorista_agregado_dados_bancarios: motorista_agregado_dados_bancarios as Json | null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return frete
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fretes"] })
      queryClient.invalidateQueries({ queryKey: ["embarques"] })
      toast({
        title: "Frete contratado",
        description: "Contrato de frete criado com sucesso",
      })
    },
    onError: (error) => {
      console.error("Erro ao criar frete:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o contrato de frete",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, motorista_agregado_dados_bancarios, ...data }: Partial<Frete> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data }
      if (motorista_agregado_dados_bancarios !== undefined) {
        updateData.motorista_agregado_dados_bancarios = motorista_agregado_dados_bancarios as Json | null
      }
      
      const { error } = await supabase
        .from("fretes")
        .update(updateData)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fretes"] })
      toast({
        title: "Frete atualizado",
        description: "Contrato de frete atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar frete:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contrato de frete",
        variant: "destructive",
      })
    },
  })
}

export const useDeleteFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fretes")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fretes"] })
      toast({
        title: "Frete removido",
        description: "Contrato de frete removido com sucesso",
      })
    },
    onError: (error) => {
      console.error("Erro ao remover frete:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o contrato de frete",
        variant: "destructive",
      })
    },
  })
}
