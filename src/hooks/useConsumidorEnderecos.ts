import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface ConsumidorEndereco {
  id: string
  user_id: string
  apelido: string
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type EnderecoInput = Omit<ConsumidorEndereco, "id" | "user_id" | "created_at" | "updated_at">

export const useConsumidorEnderecos = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["consumidor-enderecos", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("consumidor_enderecos")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as ConsumidorEndereco[]
    },
    enabled: !!user?.id,
  })

  const addMutation = useMutation({
    mutationFn: async (endereco: EnderecoInput) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      // If setting as default, unset other defaults first
      if (endereco.is_default) {
        await supabase
          .from("consumidor_enderecos")
          .update({ is_default: false })
          .eq("user_id", user.id)
      }
      
      const { error } = await supabase
        .from("consumidor_enderecos")
        .insert({ ...endereco, user_id: user.id })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-enderecos"] })
      toast.success("Endereço adicionado!")
    },
    onError: () => {
      toast.error("Erro ao adicionar endereço")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...endereco }: Partial<EnderecoInput> & { id: string }) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      // If setting as default, unset other defaults first
      if (endereco.is_default) {
        await supabase
          .from("consumidor_enderecos")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id)
      }
      
      const { error } = await supabase
        .from("consumidor_enderecos")
        .update({ ...endereco, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-enderecos"] })
      toast.success("Endereço atualizado!")
    },
    onError: () => {
      toast.error("Erro ao atualizar endereço")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_enderecos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-enderecos"] })
      toast.success("Endereço removido!")
    },
    onError: () => {
      toast.error("Erro ao remover endereço")
    },
  })

  return {
    enderecos: query.data ?? [],
    isLoading: query.isLoading,
    addEndereco: addMutation.mutate,
    updateEndereco: updateMutation.mutate,
    deleteEndereco: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
