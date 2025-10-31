import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFaturaItens = (faturaId?: string) => {
  return useQuery({
    queryKey: ["fatura-itens", faturaId],
    queryFn: async () => {
      if (!faturaId) return []

      const { data, error } = await supabase
        .from("fatura_itens")
        .select("*")
        .eq("fatura_id", faturaId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!faturaId,
  })
}
