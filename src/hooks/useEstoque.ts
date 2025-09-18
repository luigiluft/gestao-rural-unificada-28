import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface EstoqueItem {
  id: string
  user_id: string
  produto_id: string
  deposito_id: string
  quantidade_atual: number
  quantidade_disponivel?: number
  quantidade_reservada?: number
  valor_total_estoque: number
  ultima_movimentacao: string
  lotes: string[]
  produtos: {
    nome: string
    unidade_medida: string
  }
  franquias: {
    nome: string
  } | null
  franquia_nome: string
}

export const useEstoque = () => {
  return useQuery({
    queryKey: ["estoque"],
    queryFn: async (): Promise<EstoqueItem[]> => {
      // Use nova função que calcula estoque diretamente das movimentações
      const { data: estoque, error } = await supabase
        .rpc("get_estoque_from_movimentacoes")

      if (error) throw error

      // Mapear os dados para o formato esperado pelo frontend
      const estoqueFormatado = (estoque || []).map((item: any) => ({
        ...item,
        produtos: typeof item.produtos === 'string' ? JSON.parse(item.produtos) : item.produtos,
        franquias: item.franquia_nome ? { nome: item.franquia_nome } : null
      }))

      return estoqueFormatado
    },
    // Force refetch every time the component mounts
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export const useMovimentacoes = (produtoId?: string) => {
  return useQuery({
    queryKey: ["movimentacoes", produtoId],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos(nome)
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(10)

      if (produtoId) {
        query = query.eq("produto_id", produtoId)
      }

      const { data: movimentacoes, error } = await query

      if (error) throw error

      // Get franquia names for each movimentacao
      const movimentacoesWithFranquias = await Promise.all(
        (movimentacoes || []).map(async (mov) => {
          if (mov.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", mov.deposito_id)
              .single()
            
            return {
              ...mov,
              franquias: franquia
            }
          }
          return mov
        })
      )

      return movimentacoesWithFranquias || []
    },
  })
}