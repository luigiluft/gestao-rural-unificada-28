import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { Json } from "@/integrations/supabase/types"

export interface Motorista {
  id: string
  nome: string
  cpf: string
  cnh: string
  categoria_cnh?: string
  telefone?: string
  email?: string
  data_vencimento_cnh?: string
  ativo: boolean
  created_at: string
  // Novos campos TMS
  cliente_id?: string | null
  tipo?: 'PROPRIO' | 'AGREGADO'
  cpf_cnpj?: string | null
  valor_repasse_padrao?: number | null
  dados_bancarios?: Record<string, unknown> | null
}

export interface CreateMotoristaData {
  nome: string
  cpf: string
  cnh: string
  categoria_cnh?: string
  telefone?: string
  email?: string
  data_vencimento_cnh?: string
  // Novos campos TMS
  cliente_id?: string | null
  tipo?: 'PROPRIO' | 'AGREGADO'
  cpf_cnpj?: string | null
  valor_repasse_padrao?: number | null
  dados_bancarios?: Record<string, unknown> | null
}

export const useMotoristas = (clienteId?: string) => {
  return useQuery({
    queryKey: ["motoristas", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("motoristas")
        .select("*")
        .order("created_at", { ascending: false })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Motorista[]
    },
    staleTime: 30000,
  })
}

export const useMotoristasAtivos = (clienteId?: string) => {
  return useQuery({
    queryKey: ["motoristas", "ativos", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("motoristas")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Motorista[]
    },
    staleTime: 30000,
  })
}

export const useCreateMotorista = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (motorista: CreateMotoristaData) => {
      const { dados_bancarios, ...rest } = motorista
      
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'create_motorista',
          data: {
            ...rest,
            dados_bancarios: dados_bancarios as Json | null,
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar motorista')
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] })
      toast.success("Motorista cadastrado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar motorista:", error)
      toast.error("Erro ao cadastrar motorista")
    },
  })
}

export const useUpdateMotorista = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, dados_bancarios, ...updates }: { id: string } & Partial<CreateMotoristaData> & { ativo?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'update_motorista',
          data: { 
            id, 
            ...updates,
            dados_bancarios: dados_bancarios as Json | null,
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar motorista')
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] })
      toast.success("Motorista atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar motorista:", error)
      toast.error("Erro ao atualizar motorista")
    },
  })
}

export const useDeleteMotorista = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'delete_motorista',
          data: { id }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao remover motorista')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] })
      toast.success("Motorista removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover motorista:", error)
      toast.error("Erro ao remover motorista")
    },
  })
}
