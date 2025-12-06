import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface Fornecedor {
  id: string
  user_id: string
  cnpj_cpf: string
  nome: string
  nome_fantasia: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  ie: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FornecedorFormData {
  cnpj_cpf: string
  nome: string
  nome_fantasia?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  telefone?: string
  email?: string
  ie?: string
  ativo?: boolean
}

export function useFornecedores() {
  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome", { ascending: true })

      if (error) throw error
      return data as Fornecedor[]
    }
  })
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FornecedorFormData) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("fornecedores")
        .insert({
          ...formData,
          user_id: user.user.id,
          ativo: formData.ativo ?? true
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor criado com sucesso!")
    },
    onError: (error: any) => {
      console.error("Error creating fornecedor:", error)
      if (error.code === "23505") {
        toast.error("Já existe um fornecedor com este CPF/CNPJ")
      } else {
        toast.error("Erro ao criar fornecedor")
      }
    }
  })
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: FornecedorFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .update(formData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor atualizado com sucesso!")
    },
    onError: (error: any) => {
      console.error("Error updating fornecedor:", error)
      toast.error("Erro ao atualizar fornecedor")
    }
  })
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor removido com sucesso!")
    },
    onError: (error: any) => {
      console.error("Error deleting fornecedor:", error)
      toast.error("Erro ao remover fornecedor")
    }
  })
}
