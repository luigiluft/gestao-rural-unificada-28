import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFranquiaByCnpj = (cnpj?: string, ie?: string) => {
  return useQuery({
    queryKey: ["franquia-by-cnpj", cnpj, ie],
    queryFn: async () => {
      if (!cnpj && !ie) return null
      
      // Remove formatação do CNPJ se houver
      const cnpjLimpo = cnpj ? cnpj.replace(/[^\d]/g, '') : ''
      const ieLimpo = ie ? ie.replace(/[^\d]/g, '') : ''
      
      let query = supabase
        .from("franquias")
        .select("id, nome, cnpj, inscricao_estadual")
        .eq("ativo", true)

      // Primeiro tenta buscar por CNPJ
      if (cnpjLimpo) {
        query = query.eq("cnpj", cnpjLimpo)
      }
      // Se não tem CNPJ mas tem IE, busca por IE
      else if (ieLimpo) {
        query = query.eq("inscricao_estadual", ieLimpo)
      }

      const { data: franquia, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return franquia
    },
    enabled: !!(cnpj || ie),
  })
}