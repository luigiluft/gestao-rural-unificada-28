import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useRoyaltyItens = (royaltyId?: string) => {
  return useQuery({
    queryKey: ['royalty-itens', royaltyId],
    queryFn: async () => {
      if (!royaltyId) return []

      const { data, error } = await supabase
        .from('royalty_itens')
        .select('*')
        .eq('royalty_id', royaltyId)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('Royalty itens recebidos:', data)
      return data
    },
    enabled: !!royaltyId,
  })
}
