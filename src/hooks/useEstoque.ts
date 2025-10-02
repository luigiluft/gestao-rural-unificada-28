import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

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
    package_capacity?: number
    containers_per_package?: number
  }
  franquias?: {
    nome: string
  } | null
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

      // Verificar se é subconta e obter o usuário pai
      const { data: hierarchy } = await supabase
        .from("user_hierarchy")
        .select("parent_user_id")
        .eq("child_user_id", uid)
        .maybeSingle()

      let allowedDepositos: string[] = []

      if (hierarchy?.parent_user_id) {
        // Buscar role do usuário pai
        const { data: parentProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", hierarchy.parent_user_id)
          .single()

        const parentRole = parentProfile?.role
        
        if (parentRole === 'franqueado') {
          // Para subcontas de franqueados: buscar franquias onde o pai é master
          const { data: franquias } = await supabase
            .from("franquias")
            .select("id")
            .eq("master_franqueado_id", hierarchy.parent_user_id)
          
          allowedDepositos = (franquias || []).map((f) => f.id)
        } else if (parentRole === 'produtor') {
          // Para subcontas de produtores: buscar franquia do produtor pai
          const { data: produtor } = await supabase
            .from("produtores")
            .select("franquia_id")
            .eq("user_id", hierarchy.parent_user_id)
            .maybeSingle()
          
          if (produtor?.franquia_id) {
            allowedDepositos = [produtor.franquia_id]
          }
        }
      } else {
        // Para contas master: verificar se é franqueado ou produtor
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", uid)
          .single()

        if (userProfile?.role === 'franqueado') {
          const { data: franquias } = await supabase
            .from("franquias")
            .select("id")
            .eq("master_franqueado_id", uid)
          
          allowedDepositos = (franquias || []).map((f) => f.id)
        } else if (userProfile?.role === 'produtor') {
          const { data: produtor } = await supabase
            .from("produtores")
            .select("franquia_id")
            .eq("user_id", uid)
            .maybeSingle()
          
          if (produtor?.franquia_id) {
            allowedDepositos = [produtor.franquia_id]
          }
        }
      }

      // Se encontrou depósitos permitidos, filtrar o estoque
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