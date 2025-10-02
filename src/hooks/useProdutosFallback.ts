import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProdutosFallback = () => {
  return useQuery({
    queryKey: ["produtos-fallback"],
    queryFn: async () => {
      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("id, nome, unidade_medida, package_capacity, containers_per_package")
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return produtos || []
    },
  })
}