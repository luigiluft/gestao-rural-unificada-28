import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

// Função para formatar CNPJ com máscara
const formatarCnpjComMascara = (cnpj: string): string => {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  if (cnpjLimpo.length !== 14) return cnpj
  
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

export const useFranquiaByCnpj = (cnpj?: string, ie?: string) => {
  return useQuery({
    queryKey: ["franquia-by-cnpj", cnpj, ie],
    queryFn: async () => {
      if (!cnpj && !ie) return null
      
      // Buscar por CNPJ (tenta ambos os formatos)
      if (cnpj) {
        const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
        const cnpjComMascara = formatarCnpjComMascara(cnpjLimpo)
        
        const { data: franquia, error } = await supabase
          .from("franquias")
          .select("id, nome, cnpj, inscricao_municipal")
          .eq("ativo", true)
          .or(`cnpj.eq.${cnpjLimpo},cnpj.eq.${cnpjComMascara}`)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (franquia) return franquia
      }
      
      // Se não encontrou por CNPJ e tem IE, busca por IE
      if (ie) {
        const ieLimpo = ie.replace(/[^\d]/g, '')
        
        const { data: franquia, error } = await supabase
          .from("franquias")
          .select("id, nome, cnpj, inscricao_municipal")
          .eq("ativo", true)
          .eq("inscricao_municipal", ieLimpo)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        return franquia
      }

      return null
    },
    enabled: !!(cnpj || ie),
  })
}