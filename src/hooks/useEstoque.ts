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
      // Identificar usuário atual e possível franqueado master (para herdar visibilidade)
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData.user?.id

      // Buscar estoque agregado via RPC existente
      const { data: estoque, error } = await supabase
        .rpc("get_estoque_from_movimentacoes")

      if (error) throw error

      // Mapear os dados para o formato esperado pelo frontend
      const estoqueFormatado = (estoque || []).map((item: any) => ({
        ...item,
        produtos: typeof item.produtos === 'string' ? JSON.parse(item.produtos) : item.produtos,
        franquias: item.franquia_nome ? { nome: item.franquia_nome } : null
      }))

      // Se não houver usuário autenticado ou não há dados, retornar diretamente
      if (!uid || estoqueFormatado.length === 0) {
        return estoqueFormatado
      }

      // Verificar se é subconta e obter o franqueado master
      const { data: hierarchy } = await supabase
        .from("user_hierarchy")
        .select("parent_user_id")
        .eq("child_user_id", uid)
        .maybeSingle()

      const candidateOwners: string[] = hierarchy?.parent_user_id
        ? [hierarchy.parent_user_id, uid]
        : [uid]

      // Buscar todos os depósitos (franquias) pertencentes ao(s) franqueado(s) candidatos
      const { data: franquias } = await supabase
        .from("franquias")
        .select("id")
        .in("master_franqueado_id", candidateOwners)

      const allowedDepositos = (franquias || []).map((f) => f.id)

      // Se encontrou depósitos, filtrar o estoque por eles (herdando visibilidade do master)
      if (allowedDepositos.length > 0) {
        return estoqueFormatado.filter((item: any) => allowedDepositos.includes(item.deposito_id))
      }

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