import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Cliente } from "./useClientes"

/**
 * Hook para buscar um cliente pelo CPF/CNPJ usando RPC (sem restrição de RLS)
 * Retorna os dados completos se encontrar, null se não encontrar
 */
export const useClienteByCpfCnpj = (cpfCnpj: string | undefined) => {
  // Limpar o CPF/CNPJ removendo caracteres especiais
  const cleanCpfCnpj = cpfCnpj?.replace(/[^\d]/g, '') || ''
  
  // Determinar o tamanho mínimo baseado no tipo (CPF=11, CNPJ=14)
  const minLength = cleanCpfCnpj.length >= 14 ? 14 : 11
  const isValidLength = cleanCpfCnpj.length >= minLength
  
  return useQuery({
    queryKey: ["cliente-by-cpf-cnpj", cleanCpfCnpj],
    queryFn: async (): Promise<Cliente | null> => {
      if (!cleanCpfCnpj || !isValidLength) return null
      
      console.log("Buscando cliente por CPF/CNPJ via RPC:", cleanCpfCnpj)
      
      // Usar função RPC que bypassa RLS para buscar cliente por CPF/CNPJ
      const { data, error } = await supabase
        .rpc('buscar_cliente_por_cpf_cnpj', { p_cpf_cnpj: cleanCpfCnpj })

      if (error) {
        console.error("Erro ao buscar cliente por CPF/CNPJ:", error)
        return null
      }
      
      console.log("Resultado da busca RPC:", data)
      
      // A função retorna um array, pegamos o primeiro resultado
      if (data && data.length > 0) {
        console.log("Cliente encontrado:", data[0].razao_social)
        return data[0] as Cliente
      }
      
      console.log("Cliente não encontrado")
      return null
    },
    enabled: !!cleanCpfCnpj && isValidLength,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
