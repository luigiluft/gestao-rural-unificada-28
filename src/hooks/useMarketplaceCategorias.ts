import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useMarketplaceCategorias = () => {
  return useQuery({
    queryKey: ["marketplace-categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_produtos")
        .select("categoria")
        .eq("ativo_marketplace", true)
        .not("categoria", "is", null)

      if (error) throw error
      
      // Get unique categories
      const categorias = [...new Set(data?.map(p => p.categoria).filter(Boolean))]
      return ["Todos", ...categorias.sort()] as string[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
