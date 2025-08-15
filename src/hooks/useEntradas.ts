import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEntradas = () => {
  return useQuery({
    queryKey: ["entradas"],
    queryFn: async () => {
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
              franquias: franquia
            }
          }
          return entrada
        })
      )

      return entradasWithFranquias || []
    },
  })
}