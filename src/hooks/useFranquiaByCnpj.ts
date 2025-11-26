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
        
        console.log('🔍 Buscando franquia por CNPJ:', {
          original: cnpj,
          limpo: cnpjLimpo,
          comMascara: cnpjComMascara
        })
        
        // Primeira tentativa: busca usando .in() com ambos os formatos
        const { data: franquia, error } = await supabase
          .from("franquias")
          .select("id, nome, cnpj, inscricao_municipal")
          .eq("ativo", true)
          .in("cnpj", [cnpjLimpo, cnpjComMascara])
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro na busca direta:', error)
          throw error
        }

        if (franquia) {
          console.log('✅ Franquia encontrada (busca direta):', franquia)
          return franquia
        }
        
        // Fallback: buscar todas as franquias ativas e filtrar localmente
        console.log('🔄 Tentando busca alternativa (comparação local)...')
        const { data: franquias, error: errorFallback } = await supabase
          .from("franquias")
          .select("id, nome, cnpj, inscricao_municipal")
          .eq("ativo", true)

        if (errorFallback) {
          console.error('❌ Erro na busca alternativa:', errorFallback)
          throw errorFallback
        }

        const franquiaEncontrada = franquias?.find(f => 
          f.cnpj?.replace(/[^\d]/g, '') === cnpjLimpo
        )
        
        if (franquiaEncontrada) {
          console.log('✅ Franquia encontrada (busca alternativa):', franquiaEncontrada)
          return franquiaEncontrada
        }
        
        console.log('⚠️ Nenhuma franquia encontrada para o CNPJ:', cnpjLimpo)
      }
      
      // Se não encontrou por CNPJ e tem IE, busca por IE
      if (ie) {
        const ieLimpo = ie.replace(/[^\d]/g, '')
        
        console.log('🔍 Buscando franquia por IE:', ieLimpo)
        
        const { data: franquia, error } = await supabase
          .from("franquias")
          .select("id, nome, cnpj, inscricao_municipal")
          .eq("ativo", true)
          .eq("inscricao_municipal", ieLimpo)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro na busca por IE:', error)
          throw error
        }

        if (franquia) {
          console.log('✅ Franquia encontrada por IE:', franquia)
        } else {
          console.log('⚠️ Nenhuma franquia encontrada para a IE:', ieLimpo)
        }
        
        return franquia
      }

      return null
    },
    enabled: !!(cnpj || ie),
  })
}