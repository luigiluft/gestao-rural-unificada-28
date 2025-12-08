import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Cliente } from "./useClientes"

/**
 * Hook para buscar um cliente pelo CPF/CNPJ
 * Retorna os dados completos se encontrar
 */
export const useClienteByCpfCnpj = (cpfCnpj: string | undefined) => {
  // Limpar o CPF/CNPJ removendo caracteres especiais
  const cleanCpfCnpj = cpfCnpj?.replace(/[^\d]/g, '') || ''
  
  return useQuery({
    queryKey: ["cliente-by-cpf-cnpj", cleanCpfCnpj],
    queryFn: async (): Promise<Cliente | null> => {
      if (!cleanCpfCnpj || cleanCpfCnpj.length < 11) return null
      
      // Buscar cliente que tenha o CPF/CNPJ (com ou sem formatação)
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .or(`cpf_cnpj.eq.${cleanCpfCnpj},cpf_cnpj.like.%${cleanCpfCnpj}%`)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("Erro ao buscar cliente por CPF/CNPJ:", error)
        return null
      }
      
      return data as Cliente | null
    },
    enabled: !!cleanCpfCnpj && cleanCpfCnpj.length >= 11,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
