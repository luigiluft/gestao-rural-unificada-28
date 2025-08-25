import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEstoquePosicao = (posicaoId?: string) => {
  return useQuery({
    queryKey: ["estoque-posicao", posicaoId],
    queryFn: async () => {
      if (!posicaoId) return []
      
      const { data, error } = await supabase
        .from("estoque")
        .select(`
          *,
          produtos (
            nome,
            codigo
          )
        `)
        .eq("posicao_id", posicaoId)
        .gt("quantidade_atual", 0)

      if (error) throw error
      return data || []
    },
    enabled: !!posicaoId,
  })
}