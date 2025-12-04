import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface WishlistItem {
  id: string
  user_id: string
  produto_id: string
  created_at: string
  produto?: {
    id: string
    nome_produto: string
    preco_unitario: number | null
    preco_promocional: number | null
    unidade_medida: string
    imagens: string[] | null
    cliente_id: string
  }
}

export const useConsumidorWishlist = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["consumidor-wishlist", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("consumidor_wishlist")
        .select(`
          *,
          produto:cliente_produtos(
            id,
            nome_produto,
            preco_unitario,
            preco_promocional,
            unidade_medida,
            imagens,
            cliente_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as unknown as WishlistItem[]
    },
    enabled: !!user?.id,
  })

  const addMutation = useMutation({
    mutationFn: async (produtoId: string) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_wishlist")
        .insert({ user_id: user.id, produto_id: produtoId })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-wishlist"] })
      toast.success("Produto adicionado à lista de desejos!")
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.info("Produto já está na lista de desejos")
      } else {
        toast.error("Erro ao adicionar à lista de desejos")
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (produtoId: string) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("consumidor_wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("produto_id", produtoId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumidor-wishlist"] })
      toast.success("Produto removido da lista de desejos")
    },
    onError: () => {
      toast.error("Erro ao remover da lista de desejos")
    },
  })

  const isInWishlist = (produtoId: string) => {
    return query.data?.some(item => item.produto_id === produtoId) || false
  }

  return {
    wishlist: query.data ?? [],
    isLoading: query.isLoading,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
    isInWishlist,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
