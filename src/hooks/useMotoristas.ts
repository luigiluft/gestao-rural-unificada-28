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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("motoristas")
        .insert({
          ...motorista,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from("motoristas")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
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
      const { error } = await supabase
        .from("motoristas")
        .delete()
        .eq("id", id)

      if (error) throw error
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