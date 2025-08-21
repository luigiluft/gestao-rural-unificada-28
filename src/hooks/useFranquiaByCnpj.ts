import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFranquiaByCnpj = (cnpj?: string) => {
  return useQuery({
    queryKey: ["franquia-by-cnpj", cnpj],
    queryFn: async () => {
      if (!cnpj) return null
      
      // Remove formatação do CNPJ se houver
      const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
      
      const { data: franquia, error } = await supabase
        .from("franquias")
        .select("id, nome, cnpj")
        .eq("cnpj", cnpjLimpo)
        .eq("ativo", true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return franquia
    },
    enabled: !!cnpj,
  })
}