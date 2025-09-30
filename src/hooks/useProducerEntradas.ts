import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProducerEntradas = () => {
  return useQuery({
    queryKey: ["producer-entradas"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      // Get producer's CPF/CNPJ
      const { data: profile } = await supabase
        .from("profiles")
        .select("cpf_cnpj")
        .eq("user_id", user.user.id)
        .single()

      if (!profile?.cpf_cnpj) {
        console.warn("Producer doesn't have CPF/CNPJ registered")
      }

      const { data: entradas, error } = await supabase
        .from("entradas")
        .select(`
          *,
          fornecedores(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .or(`user_id.eq.${user.user.id}${profile?.cpf_cnpj ? `,emitente_cnpj.eq.${profile.cpf_cnpj},destinatario_cpf_cnpj.eq.${profile.cpf_cnpj}` : ''}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get franquia names for each entrada
      const entradasWithFranquias = await Promise.all(
        (entradas || []).map(async (entrada) => {
          if (entrada.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", entrada.deposito_id)
              .single()
            
            return {
              ...entrada,
              franquia_nome: franquia?.nome
            }
          }
          return entrada
        })
      )

      return entradasWithFranquias || []
    },
  })
}