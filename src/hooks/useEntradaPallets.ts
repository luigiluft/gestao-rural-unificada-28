import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface EntradaPallet {
  id: string
  entrada_id: string
  numero_pallet: number
  descricao?: string
  peso_total?: number
  codigo_barras?: string
  quantidade_atual: number
  created_at: string
  updated_at: string
}

export interface EntradaPalletItem {
  id: string
  pallet_id: string
  entrada_item_id: string
  quantidade: number
  is_avaria?: boolean
  created_at: string
  entrada_itens?: {
    id: string
    nome_produto: string
    codigo_produto?: string
    quantidade: number
  }
}

export const useEntradaPallets = (entradaId: string) => {
  return useQuery({
    queryKey: ["entrada-pallets", entradaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entrada_pallets")
        .select(`
          *,
          entrada_pallet_itens (
            *,
            entrada_itens (
              id,
              nome_produto,
              codigo_produto,
              quantidade
            )
          )
        `)
        .eq("entrada_id", entradaId)
        .order("numero_pallet")

      if (error) throw error
      return data as (EntradaPallet & { entrada_pallet_itens: EntradaPalletItem[] })[]
    },
    enabled: !!entradaId,
  })
}

export const useCreatePallet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pallet: Omit<EntradaPallet, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("entrada_pallets")
        .insert(pallet)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets", data.entrada_id] })
      toast.success("Pallet criado com sucesso")
    },
    onError: (error) => {
      console.error("Erro ao criar pallet:", error)
      toast.error("Erro ao criar pallet")
    },
  })
}

export const useUpdatePallet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EntradaPallet> & { id: string }) => {
      const { data, error } = await supabase
        .from("entrada_pallets")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets", data.entrada_id] })
      toast.success("Pallet atualizado com sucesso")
    },
    onError: (error) => {
      console.error("Erro ao atualizar pallet:", error)
      toast.error("Erro ao atualizar pallet")
    },
  })
}

export const useDeletePallet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entrada_pallets")
        .delete()
        .eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets"] })
      toast.success("Pallet removido com sucesso")
    },
    onError: (error) => {
      console.error("Erro ao remover pallet:", error)
      toast.error("Erro ao remover pallet")
    },
  })
}

export const useAddItemToPallet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: Omit<EntradaPalletItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("entrada_pallet_itens")
        .insert({
          pallet_id: item.pallet_id,
          entrada_item_id: item.entrada_item_id,
          quantidade: item.quantidade,
          is_avaria: item.is_avaria || false
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets"] })
      toast.success("Item adicionado ao pallet")
    },
    onError: (error) => {
      console.error("Erro ao adicionar item ao pallet:", error)
      toast.error("Erro ao adicionar item ao pallet")
    },
  })
}

export const useRemoveItemFromPallet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entrada_pallet_itens")
        .delete()
        .eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets"] })
      toast.success("Item removido do pallet")
    },
    onError: (error) => {
      console.error("Erro ao remover item do pallet:", error)
      toast.error("Erro ao remover item do pallet")
    },
  })
}

export const useUpdatePalletItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EntradaPalletItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("entrada_pallet_itens")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrada-pallets"] })
      toast.success("Quantidade atualizada")
    },
    onError: (error) => {
      console.error("Erro ao atualizar item do pallet:", error)
      toast.error("Erro ao atualizar item do pallet")
    },
  })
}