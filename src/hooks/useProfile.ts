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
      
      // Buscar produtores que têm estoque nas franquias do franqueado logado
      // Usando o relacionamento correto: produtores.franquia_id -> franquias.id
      const { data, error } = await supabase
        .from("produtores")
        .select(`
          user_id,
          profiles!inner(
            user_id,
            nome,
            email,
            role
          ),
          franquias!inner(
            id,
            nome,
            master_franqueado_id
          )
        `)
        .eq("ativo", true)
        .eq("profiles.role", "produtor")
        .eq("franquias.master_franqueado_id", user.id)
        .eq("franquias.ativo", true)

      if (error) throw error
      
      // Filtrar apenas produtores que realmente têm estoque
      if (!data || data.length === 0) return []
      
      const produtorIds = data.map(p => p.user_id)
      
      // Verificar quais produtores têm estoque atual > 0
      const { data: estoqueData, error: estoqueError } = await supabase
        .from("estoque")
        .select("user_id")
        .gt("quantidade_atual", 0)
        .in("user_id", produtorIds)

      if (estoqueError) throw estoqueError
      
      const produtoresComEstoque = estoqueData?.map(e => e.user_id) || []
      
      // Retornar apenas produtores que têm estoque
      return data
        .filter(p => produtoresComEstoque.includes(p.user_id))
        .map(p => ({
          user_id: p.profiles.user_id,
          nome: p.profiles.nome,
          email: p.profiles.email
        }))
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
  })
}