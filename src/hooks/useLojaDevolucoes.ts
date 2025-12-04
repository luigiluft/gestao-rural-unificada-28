import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface LojaDevolucao {
  id: string
  pedido_id: string
  user_id: string
  motivo: string
  descricao: string | null
  fotos: string[]
  status: 'solicitada' | 'em_analise' | 'aprovada' | 'rejeitada' | 'concluida'
  resposta_vendedor: string | null
  data_resposta: string | null
  created_at: string
  updated_at: string
  pedido?: {
    numero_pedido: string
    total: number
  }
}

export type DevolucaoInput = {
  pedido_id: string
  motivo: string
  descricao?: string
  fotos?: string[]
}

export const useLojaDevolucoes = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["loja-devolucoes", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("loja_devolucoes")
        .select(`
          *,
          pedido:loja_pedidos(numero_pedido, total)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []).map(d => ({
        ...d,
        fotos: Array.isArray(d.fotos) ? d.fotos as string[] : []
      })) as unknown as LojaDevolucao[]
    },
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: async (devolucao: DevolucaoInput) => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const { error } = await supabase
        .from("loja_devolucoes")
        .insert({ 
          ...devolucao, 
          user_id: user.id,
          fotos: devolucao.fotos || []
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-devolucoes"] })
      toast.success("Solicitação de devolução enviada!")
    },
    onError: () => {
      toast.error("Erro ao solicitar devolução")
    },
  })

  return {
    devolucoes: query.data ?? [],
    isLoading: query.isLoading,
    criarDevolucao: createMutation.mutate,
    isCriando: createMutation.isPending,
  }
}
