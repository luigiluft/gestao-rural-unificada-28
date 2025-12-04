import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export interface ConsumidorPedido {
  id: string
  numero_pedido: string
  status: string
  total: number
  subtotal: number
  frete: number | null
  origem: string
  created_at: string
  updated_at: string
  vendedor_cliente_id: string
  endereco_entrega: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
  } | null
  itens?: {
    id: string
    produto_id: string
    quantidade: number
    preco_unitario: number
    nome_produto: string
  }[]
}

export const useConsumidorPedidos = () => {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ["consumidor-pedidos", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("loja_pedidos")
        .select(`
          *,
          itens:loja_pedido_itens(
            id,
            produto_id,
            quantidade,
            preco_unitario,
            nome_produto
          )
        `)
        .eq("comprador_user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []).map(p => ({
        ...p,
        endereco_entrega: typeof p.endereco_entrega === 'object' ? p.endereco_entrega : null
      })) as unknown as ConsumidorPedido[]
    },
    enabled: !!user?.id,
  })

  return {
    pedidos: query.data ?? [],
    isLoading: query.isLoading,
  }
}
