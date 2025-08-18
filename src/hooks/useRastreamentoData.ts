import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useRastreamentoEntradas = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-entradas", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      let query = supabase
        .from("entradas")
        .select(`
          *,
          fornecedores(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          ),
          profiles!entradas_user_id_fkey(nome)
        `)
        .in("status_aprovacao", ["aguardando_transporte", "em_transferencia"])
        .order("created_at", { ascending: false })

      // If not admin, filter by user_id
      if (!isAdmin) {
        query = query.eq("user_id", user.id)
      }

      const { data: entradas, error } = await query

      if (error) throw error

      // Get franquia names for each entrada
      const entradasWithFranquias = await Promise.all(
        (entradas || []).map(async (entrada) => {
          if (entrada.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", entrada.deposito_id)
              .single()
            
            return {
              ...entrada,
              franquia_nome: franquia?.nome
            }
          }
          return entrada
        })
      )

      return entradasWithFranquias || []
    },
    enabled: !!user?.id,
  })
}

export const useRastreamentoEstoque = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-estoque", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      let query = supabase
        .from("estoque")
        .select(`
          *,
          produtos(nome, unidade_medida),
          profiles!estoque_user_id_fkey(nome)
        `)
        .gt("quantidade_atual", 0)
        .order("quantidade_atual", { ascending: false })

      // If not admin, filter by user_id
      if (!isAdmin) {
        query = query.eq("user_id", user.id)
      }

      const { data: estoque, error } = await query

      if (error) throw error

      // Get franquia names for each estoque item
      const estoqueWithFranquias = await Promise.all(
        (estoque || []).map(async (item) => {
          if (item.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", item.deposito_id)
              .single()
            
            return {
              ...item,
              franquia_nome: franquia?.nome
            }
          }
          return item
        })
      )

      return estoqueWithFranquias || []
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!user?.id,
  })
}

export const useRastreamentoSaidas = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-saidas", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      let query = supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          ),
          rastreamentos(
            codigo_rastreamento,
            status_atual,
            transportadora,
            data_prevista_entrega
          ),
          profiles!saidas_user_id_fkey(nome)
        `)
        .in("status", ["separacao_pendente", "separado", "expedido"])
        .order("created_at", { ascending: false })

      // If not admin, filter by user_id
      if (!isAdmin) {
        query = query.eq("user_id", user.id)
      }

      const { data: saidas, error } = await query

      if (error) throw error

      // Get franquia names for each saida
      const saidasWithFranquias = await Promise.all(
        (saidas || []).map(async (saida) => {
          if (saida.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", saida.deposito_id)
              .single()
            
            return {
              ...saida,
              franquia_nome: franquia?.nome
            }
          }
          return saida
        })
      )

      return saidasWithFranquias || []
    },
    enabled: !!user?.id,
  })
}