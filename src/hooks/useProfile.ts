import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useProfile = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
}

export const useProdutores = () => {
  return useQuery({
    queryKey: ["produtores-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .eq("role", "produtor")
        .order("nome")

      if (error) throw error
      return data || []
    },
  })
}

export const useFazendas = (produtorId?: string) => {
  return useQuery({
    queryKey: ["fazendas", produtorId],
    queryFn: async () => {
      let query = supabase
        .from("fazendas")
        .select("*")
        .eq("ativo", true)
        .order("nome")

      if (produtorId) {
        query = query.eq("produtor_id", produtorId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!produtorId,
  })
}

export const useProdutoresComEstoqueNaFranquia = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["produtores-com-estoque-franquia", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      // Buscar IDs das franquias do franqueado logado
      const { data: franquias, error: franquiasError } = await supabase
        .from("franquias")
        .select("id")
        .eq("master_franqueado_id", user.id)
        .eq("ativo", true)

      if (franquiasError) throw franquiasError
      if (!franquias || franquias.length === 0) return []

      const franquiaIds = franquias.map(f => f.id)

      // Buscar user_ids dos produtores que têm estoque nas franquias
      const { data: estoqueUsers, error: estoqueError } = await supabase
        .from("estoque")
        .select("user_id")
        .gt("quantidade_atual", 0)
        .in("deposito_id", franquiaIds)

      if (estoqueError) throw estoqueError
      if (!estoqueUsers || estoqueUsers.length === 0) return []

      const userIds = [...new Set(estoqueUsers.map(e => e.user_id))]

      // Buscar perfis dos produtores
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          user_id, 
          nome, 
          email
        `)
        .eq("role", "produtor")
        .in("user_id", userIds)
        .order("nome")

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })
}