import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFranquiaByProdutorCpf = (cpfCnpj?: string) => {
  return useQuery({
    queryKey: ["franquia-by-produtor-cpf", cpfCnpj],
    queryFn: async () => {
      if (!cpfCnpj) return null
      
      // Primeiro, buscar o produtor pelo CPF/CNPJ
      const { data: produtor, error: produtorError } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .eq("cpf_cnpj", cpfCnpj)
        .eq("role", "produtor")
        .maybeSingle()

      if (produtorError) {
        throw produtorError
      }

      if (!produtor) {
        return null
      }

      // Depois, buscar a franquia associada ao produtor
      const { data: produtorData, error: franquiaError } = await supabase
        .from("produtores")
        .select(`
          franquia_id,
          franquias!inner(
            id,
            nome,
            cnpj,
            inscricao_estadual
          )
        `)
        .eq("user_id", produtor.user_id)
        .maybeSingle()

      if (franquiaError) {
        throw franquiaError
      }

      if (!produtorData?.franquias) {
        return null
      }

      return {
        franquia: produtorData.franquias,
        produtor: produtor
      }
    },
    enabled: !!cpfCnpj,
  })
}