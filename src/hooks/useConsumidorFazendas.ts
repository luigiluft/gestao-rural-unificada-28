import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface ConsumidorFazenda {
  id: string
  user_id: string
  nome: string
  tipo: string
  endereco_cep: string | null
  endereco_logradouro: string | null
  endereco_numero: string | null
  endereco_complemento: string | null
  endereco_bairro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  area_hectares: number | null
  car: string | null
  created_at: string
  updated_at: string
}

export type FazendaInput = Omit<ConsumidorFazenda, "id" | "user_id" | "created_at" | "updated_at">

export const useConsumidorFazendas = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["consumidor-fazendas", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("consumidor_fazendas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as ConsumidorFazenda[]
    },
    enabled: !!user?.id,
  })

  const addMutation = useMutation({
    mutationFn: async (fazenda: FazendaInput) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_fazendas")
        .insert({ ...fazenda, user_id: user.id })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-fazendas"] })
      toast.success("Fazenda adicionada!")
    },
    onError: () => {
      toast.error("Erro ao adicionar fazenda")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...fazenda }: Partial<FazendaInput> & { id: string }) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_fazendas")
        .update({ ...fazenda, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-fazendas"] })
      toast.success("Fazenda atualizada!")
    },
    onError: () => {
      toast.error("Erro ao atualizar fazenda")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_fazendas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-fazendas"] })
      toast.success("Fazenda removida!")
    },
    onError: () => {
      toast.error("Erro ao remover fazenda")
    },
  })

  return {
    fazendas: query.data ?? [],
    isLoading: query.isLoading,
    addFazenda: addMutation.mutate,
    updateFazenda: updateMutation.mutate,
    deleteFazenda: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
