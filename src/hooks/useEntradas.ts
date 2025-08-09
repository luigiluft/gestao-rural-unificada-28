import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEntradas = () => {
  return useQuery({
    queryKey: ["entradas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entradas")
        .select(`
          *,
          depositos(nome),
          fornecedores(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}