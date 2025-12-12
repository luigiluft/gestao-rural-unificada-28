import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  ano?: number
  capacidade_peso?: number
  capacidade_volume?: number
  tipo: string
  ativo: boolean
  created_at: string
  // Novos campos TMS
  cliente_id?: string | null
  tipo_propriedade?: 'PROPRIO' | 'AGREGADO' | 'TERCEIRO'
  motorista_padrao_id?: string | null
}

export interface CreateVeiculoData {
  placa: string
  modelo: string
  marca: string
  ano?: number
  capacidade_peso?: number
  capacidade_volume?: number
  tipo: string
  // Novos campos TMS
  cliente_id?: string | null
  tipo_propriedade?: 'PROPRIO' | 'AGREGADO' | 'TERCEIRO'
  motorista_padrao_id?: string | null
}

export const useVeiculos = (clienteId?: string) => {
  return useQuery({
    queryKey: ["veiculos", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("veiculos")
        .select("*")
        .order("created_at", { ascending: false })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Veiculo[]
    },
    staleTime: 30000,
  })
}

export const useVeiculosAtivos = (clienteId?: string) => {
  return useQuery({
    queryKey: ["veiculos", "ativos", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("veiculos")
        .select("*")
        .eq("ativo", true)
        .order("placa", { ascending: true })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Veiculo[]
    },
    staleTime: 30000,
  })
}

export const useCreateVeiculo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (veiculo: CreateVeiculoData) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'create_veiculo',
          data: veiculo
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar veículo')
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] })
      toast.success("Veículo cadastrado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar veículo:", error)
      toast.error("Erro ao cadastrar veículo")
    },
  })
}

export const useUpdateVeiculo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateVeiculoData> & { ativo?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'update_veiculo',
          data: { id, ...updates }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar veículo')
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] })
      toast.success("Veículo atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar veículo:", error)
      toast.error("Erro ao atualizar veículo")
    },
  })
}

export const useDeleteVeiculo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'delete_veiculo',
          data: { id }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao remover veículo')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] })
      toast.success("Veículo removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover veículo:", error)
      toast.error("Erro ao remover veículo")
    },
  })
}
