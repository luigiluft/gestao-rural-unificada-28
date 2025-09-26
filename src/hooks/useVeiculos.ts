import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useVeiculos = () => {
  return useQuery({
    queryKey: ["veiculos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
  })
}

export const useCreateVeiculo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (veiculo: {
      placa: string
      modelo: string
      marca: string
      ano?: number
      capacidade_peso?: number
      capacidade_volume?: number
      tipo: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("veiculos")
        .insert({
          ...veiculo,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      placa: string
      modelo: string
      marca: string
      ano: number
      capacidade_peso: number
      capacidade_volume: number
      tipo: string
      ativo: boolean
    }>) => {
      const { data, error } = await supabase
        .from("veiculos")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
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
      const { error } = await supabase
        .from("veiculos")
        .delete()
        .eq("id", id)

      if (error) throw error
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