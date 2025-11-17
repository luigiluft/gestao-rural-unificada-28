import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface ClienteDeposito {
  id: string
  cliente_id: string
  franquia_id: string
  tipo_regime: 'armazem_geral' | 'filial'
  nome: string
  codigo_interno: string | null
  endereco_complementar: string | null
  contato_local: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ClienteDepositoWithFranquia extends ClienteDeposito {
  franquia?: {
    nome: string
    cnpj: string
  }
}

/**
 * Hook para buscar todos os depósitos de um cliente
 */
export const useClienteDepositos = (clienteId?: string) => {
  return useQuery({
    queryKey: ["cliente-depositos", clienteId],
    queryFn: async (): Promise<ClienteDepositoWithFranquia[]> => {
      if (!clienteId) return []
      
      const { data, error } = await supabase
        .from("cliente_depositos")
        .select(`
          *,
          franquia:franquias(nome, cnpj)
        `)
        .eq("cliente_id", clienteId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return (data || []) as ClienteDepositoWithFranquia[]
    },
    enabled: !!clienteId,
  })
}

/**
 * Hook para buscar depósitos hospedados em uma franquia
 */
export const useClienteDepositosPorFranquia = (franquiaId?: string) => {
  return useQuery({
    queryKey: ["cliente-depositos-franquia", franquiaId],
    queryFn: async (): Promise<ClienteDepositoWithFranquia[]> => {
      if (!franquiaId) return []
      
      const { data, error } = await supabase
        .from("cliente_depositos")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .eq("franquia_id", franquiaId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return (data || []) as ClienteDepositoWithFranquia[]
    },
    enabled: !!franquiaId,
  })
}

/**
 * Hook para buscar um depósito específico por ID
 */
export const useClienteDeposito = (depositoId?: string) => {
  return useQuery({
    queryKey: ["cliente-deposito", depositoId],
    queryFn: async (): Promise<ClienteDeposito | null> => {
      if (!depositoId) return null
      
      const { data, error } = await supabase
        .from("cliente_depositos")
        .select("*")
        .eq("id", depositoId)
        .single()

      if (error) throw error
      return data as ClienteDeposito | null
    },
    enabled: !!depositoId,
  })
}

/**
 * Hook para criar um novo depósito
 */
export const useCreateClienteDeposito = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<ClienteDeposito, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'ativo'>) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Usuário não autenticado")
      
      const { data: deposito, error } = await supabase
        .from("cliente_depositos")
        .insert({
          ...data,
          created_by: user.user.id,
          ativo: true
        })
        .select()
        .single()

      if (error) throw error
      return deposito
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-depositos", variables.cliente_id] })
      queryClient.invalidateQueries({ queryKey: ["cliente-depositos-franquia", variables.franquia_id] })
      toast.success("Depósito criado com sucesso!")
    },
    onError: (error: any) => {
      console.error("Erro ao criar depósito:", error)
      if (error.message?.includes("unique")) {
        toast.error("Este cliente já possui um depósito nesta franquia")
      } else if (error.message?.includes("CPF")) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao criar depósito")
      }
    },
  })
}

/**
 * Hook para atualizar um depósito existente
 */
export const useUpdateClienteDeposito = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClienteDeposito> & { id: string }) => {
      const { data: deposito, error } = await supabase
        .from("cliente_depositos")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return deposito
    },
    onSuccess: (deposito) => {
      if (deposito) {
        queryClient.invalidateQueries({ queryKey: ["cliente-depositos", deposito.cliente_id] })
        queryClient.invalidateQueries({ queryKey: ["cliente-depositos-franquia", deposito.franquia_id] })
        queryClient.invalidateQueries({ queryKey: ["cliente-deposito", deposito.id] })
      }
      toast.success("Depósito atualizado com sucesso!")
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar depósito:", error)
      if (error.message?.includes("CPF")) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao atualizar depósito")
      }
    },
  })
}

/**
 * Hook para desativar (soft delete) um depósito
 */
export const useDeleteClienteDeposito = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (depositoId: string) => {
      const { data: deposito, error } = await supabase
        .from("cliente_depositos")
        .update({ ativo: false })
        .eq("id", depositoId)
        .select()
        .single()

      if (error) throw error
      return deposito
    },
    onSuccess: (deposito) => {
      if (deposito) {
        queryClient.invalidateQueries({ queryKey: ["cliente-depositos", deposito.cliente_id] })
        queryClient.invalidateQueries({ queryKey: ["cliente-depositos-franquia", deposito.franquia_id] })
      }
      toast.success("Depósito desativado com sucesso!")
    },
    onError: (error: any) => {
      console.error("Erro ao desativar depósito:", error)
      toast.error("Erro ao desativar depósito")
    },
  })
}
