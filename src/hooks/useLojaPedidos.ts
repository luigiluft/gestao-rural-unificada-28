import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface LojaPedido {
  id: string
  numero_pedido: string
  vendedor_cliente_id: string
  comprador_user_id: string | null
  comprador_nome: string
  comprador_email: string
  comprador_telefone: string | null
  comprador_cpf_cnpj: string | null
  endereco_entrega: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
  }
  subtotal: number
  valor_frete: number
  valor_desconto: number
  valor_total: number
  status: string
  origem: string
  loja_slug: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  itens?: LojaPedidoItem[]
}

export interface LojaPedidoItem {
  id: string
  pedido_id: string
  anuncio_id: string
  quantidade: number
  preco_unitario: number
  valor_total: number
  created_at: string
  anuncio?: {
    titulo: string
    imagens: string[]
  }
}

export const useLojaPedidos = () => {
  const { selectedCliente } = useCliente()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["loja-pedidos", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return []

      const { data, error } = await supabase
        .from("loja_pedidos")
        .select(`
          *,
          itens:loja_pedido_itens(
            *,
            anuncio:loja_anuncios(titulo, imagens)
          )
        `)
        .eq("vendedor_cliente_id", selectedCliente.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as LojaPedido[]
    },
    enabled: !!selectedCliente?.id,
  })

  const atualizarStatusMutation = useMutation({
    mutationFn: async ({ pedidoId, status }: { pedidoId: string; status: string }) => {
      const { error } = await supabase
        .from("loja_pedidos")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", pedidoId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-pedidos"] })
      toast.success("Status do pedido atualizado!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status do pedido")
    },
  })

  return {
    pedidos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    atualizarStatus: atualizarStatusMutation.mutate,
    isAtualizando: atualizarStatusMutation.isPending,
  }
}

// Hook para pedidos do comprador
export const useMeusPedidos = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["meus-pedidos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from("loja_pedidos")
        .select(`
          *,
          itens:loja_pedido_itens(
            *,
            anuncio:loja_anuncios(titulo, imagens)
          )
        `)
        .eq("comprador_user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as LojaPedido[]
    },
  })

  return {
    pedidos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
