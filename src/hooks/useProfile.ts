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
      
      // Primeiro buscar IDs das franquias do franqueado
      const { data: franquias, error: franquiasError } = await supabase
        .from("franquias")
        .select("id")
        .eq("master_franqueado_id", user.id)
        .eq("ativo", true)

      if (franquiasError) throw franquiasError
      if (!franquias || franquias.length === 0) return []
      
      const franquiaIds = franquias.map(f => f.id)
      
      // Buscar produtores vinculados às franquias
      const { data: produtoresData, error: produtoresError } = await supabase
        .from("produtores")
        .select("user_id, franquia_id")
        .eq("ativo", true)
        .in("franquia_id", franquiaIds)

      if (produtoresError) throw produtoresError
      if (!produtoresData || produtoresData.length === 0) return []
      
      const produtorIds = produtoresData.map(p => p.user_id)
      
      // Verificar quais produtores têm estoque atual > 0
      const { data: estoqueData, error: estoqueError } = await supabase
        .from("estoque")
        .select("user_id")
        .gt("quantidade_atual", 0)
        .in("user_id", produtorIds)

      if (estoqueError) throw estoqueError
      if (!estoqueData || estoqueData.length === 0) return []
      
      const produtoresComEstoque = estoqueData.map(e => e.user_id)
      
      // Buscar perfis dos produtores que têm estoque
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          user_id, 
          nome, 
          email
        `)
        .eq("role", "produtor")
        .in("user_id", produtoresComEstoque)
        .order("nome")

      if (profilesError) throw profilesError
      return profilesData || []
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
  })
}