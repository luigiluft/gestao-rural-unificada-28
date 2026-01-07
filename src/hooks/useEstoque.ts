import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"
import { useCliente } from "@/contexts/ClienteContext"

export interface EstoqueItem {
  produto_id: string
  deposito_id: string
  user_id: string
  lote: string
  quantidade_atual: number
  valor_unitario: number
  valor_total: number
  produtos: {
    nome: string
    codigo?: string
    unidade_medida: string
  }
  franquias?: {
    nome: string
  } | null
}

export const useEstoque = () => {
  const { depositoId, shouldFilter, clienteDepositoId } = useDepositoFilter()
  const { selectedCliente } = useCliente()
  
  return useQuery({
    queryKey: ["estoque", depositoId, clienteDepositoId, selectedCliente?.id],
    queryFn: async (): Promise<EstoqueItem[]> => {
      // Buscar estoque agregado via RPC existente
      const { data: estoque, error } = await supabase
        .rpc("get_estoque_from_movimentacoes")

      if (error) throw error

      // Mapear os dados para o formato esperado pelo frontend
      let estoqueFormatado = (estoque || []).map((item: any) => ({
        ...item,
        produtos: typeof item.produtos === 'string' ? JSON.parse(item.produtos) : item.produtos,
        franquias: item.franquia_nome ? { nome: item.franquia_nome } : null
      }))

      // Aplicar filtro de depósito se necessário
      if (shouldFilter && depositoId) {
        estoqueFormatado = estoqueFormatado.filter((item: any) => item.deposito_id === depositoId)
      }

      return estoqueFormatado
    },
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
