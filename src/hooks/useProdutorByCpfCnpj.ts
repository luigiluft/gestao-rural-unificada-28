import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProdutorByCpfCnpj = (cpfCnpj?: string) => {
  return useQuery({
    queryKey: ["produtor-by-cpf-cnpj", cpfCnpj],
    queryFn: async () => {
      if (!cpfCnpj) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, cpf_cnpj, role")
        .eq("cpf_cnpj", cpfCnpj)
        .eq("role", "cliente")
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!cpfCnpj,
  })
}

export const findProdutorByCpfCnpj = async (cpfCnpj: string) => {
  if (!cpfCnpj) return null
  
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, nome, email, cpf_cnpj, role")
    .eq("cpf_cnpj", cpfCnpj)
    .eq("role", "cliente")
    .maybeSingle()

  if (error) throw error
  return data
}