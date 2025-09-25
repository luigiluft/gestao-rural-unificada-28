import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useViagensNotifications = () => {
  return useQuery({
    queryKey: ["viagens-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("id, status")
        .eq("status", "planejada")

      if (error) {
        console.error('Error fetching viagens notifications:', error)
        return 0
      }

      return data?.length || 0
    },
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute to keep notifications updated
  })
}