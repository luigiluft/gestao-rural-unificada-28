import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Cliente } from "./useClientes"

/**
 * Hook para buscar um cliente pelo CPF/CNPJ
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
      
      console.log("Buscando cliente por CPF/CNPJ:", cleanCpfCnpj)
      
      // Buscar todos os clientes e filtrar no lado do cliente
      // Isso é necessário porque o banco pode ter CPF/CNPJ com ou sem formatação
      const { data, error } = await supabase
        .from("clientes")
        .select("*")

      if (error) {
        console.error("Erro ao buscar cliente por CPF/CNPJ:", error)
        return null
      }
      
      // Filtrar localmente removendo formatação de ambos
      const cliente = data?.find(c => {
        const dbClean = c.cpf_cnpj?.replace(/[^\d]/g, '') || ''
        return dbClean === cleanCpfCnpj
      })
      
      console.log("Cliente encontrado:", cliente?.razao_social || "Não encontrado")
      
      // IMPORTANTE: Sempre retornar null ao invés de undefined
      return (cliente as Cliente) || null
    },
    enabled: !!cleanCpfCnpj && isValidLength,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
