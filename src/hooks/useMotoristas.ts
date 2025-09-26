import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useMotoristas = () => {
  return useQuery({
    queryKey: ["motoristas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motoristas")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}

export const useCreateMotorista = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (motorista: {
      nome: string
      cpf: string
      cnh: string
      categoria_cnh?: string
      telefone?: string
      email?: string
      data_vencimento_cnh?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'create_motorista',
          data: motorista
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      nome: string
      cpf: string
      cnh: string
      categoria_cnh: string
      telefone: string
      email: string
      data_vencimento_cnh: string
      ativo: boolean
    }>) => {
      const { data, error } = await supabase.functions.invoke('manage-usuarios', {
        body: {
          action: 'update_motorista',
          data: { id, ...updates }
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