import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Hook para buscar produtores que têm contratos ativos com a franquia do usuário logado
 * Usado no formulário de saída para selecionar o produtor destinatário
 */
export const useProdutoresParaSaida = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["produtores-para-saida", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      // Buscar franquias do franqueado logado
      const { data: franquias, error: franquiasError } = await supabase
        .from("franquias")
        .select("id")
        .eq("master_franqueado_id", user.id)
        .eq("ativo", true)

      if (franquiasError) throw franquiasError
      if (!franquias || franquias.length === 0) return []
      
      const franquiaIds = franquias.map(f => f.id)
      
      // Buscar produtores com contratos ativos nessas franquias
      const { data: contratos, error: contratosError } = await supabase
        .from("contratos_servico")
        .select("produtor_id")
        .in("franquia_id", franquiaIds)
        .eq("status", "ativo")

      if (contratosError) throw contratosError
      if (!contratos || contratos.length === 0) return []
      
      const produtorIds = [...new Set(contratos.map(c => c.produtor_id))]
      
      // Buscar perfis dos produtores
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, email, cpf_cnpj")
        .eq("role", "produtor")
        .in("user_id", produtorIds)
        .order("nome")

      if (profilesError) throw profilesError
      return profiles || []
    },
    enabled: !!user?.id,
  })
}
