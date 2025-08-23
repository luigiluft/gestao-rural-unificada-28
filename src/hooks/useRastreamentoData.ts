import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useRastreamentoEntradas = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-entradas", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      console.log("Fetching entradas for user:", user.id)

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw profileError
      }

      const isAdmin = profile?.role === 'admin'
      console.log("User role:", profile?.role, "Is admin:", isAdmin)

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

      if (error) {
        console.error("Error fetching entradas:", error)
        throw error
      }

      console.log("Fetched entradas:", entradas?.length || 0)

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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRastreamentoEstoque = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-estoque", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      console.log("Fetching estoque for user:", user.id)

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw profileError
      }

      const isAdmin = profile?.role === 'admin'
      console.log("User role:", profile?.role, "Is admin:", isAdmin)

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

      if (error) {
        console.error("Error fetching estoque:", error)
        throw error
      }

      console.log("Fetched estoque:", estoque?.length || 0)

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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRastreamentoSaidas = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["rastreamento-saidas", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      console.log("Fetching saidas for user:", user.id)

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw profileError
      }

      const isAdmin = profile?.role === 'admin'
      console.log("User role:", profile?.role, "Is admin:", isAdmin)

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

      if (error) {
        console.error("Error fetching saidas:", error)
        throw error
      }

      console.log("Fetched saidas:", saidas?.length || 0)

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
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}