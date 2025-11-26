import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface Transportadora {
  id: string
  user_id: string
  nome: string
  cnpj: string
  contato?: string | null
  email?: string | null
  especialidade?: string | null
  regiao_atendimento?: string | null
  valor_km?: number | null
  valor_minimo?: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export const useTransportadoras = () => {
  return useQuery({
    queryKey: ["transportadoras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("*")
        .order("nome")

      if (error) throw error
      return data as Transportadora[]
    }
  })
}

export const useCreateTransportadora = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (transportadora: Omit<Transportadora, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("transportadoras")
        .insert({
          ...transportadora,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] })
      toast({
        title: "Transportadora criada",
        description: "A transportadora foi cadastrada com sucesso."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar transportadora",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

export const useUpdateTransportadora = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transportadora> & { id: string }) => {
      const { data, error } = await supabase
        .from("transportadoras")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] })
      toast({
        title: "Transportadora atualizada",
        description: "As informações foram atualizadas com sucesso."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar transportadora",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

export const useDeleteTransportadora = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transportadoras")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] })
      toast({
        title: "Transportadora excluída",
        description: "A transportadora foi removida com sucesso."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir transportadora",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}
