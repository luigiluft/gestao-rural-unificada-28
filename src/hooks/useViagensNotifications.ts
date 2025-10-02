import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useViagensNotifications = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["viagens-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      // Find motorista by auth_user_id
      const { data: motorista, error: motoristaError } = await supabase
        .from("motoristas")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (motoristaError || !motorista) {
        return 0
      }

      // Count trips that need attention from the driver:
      // - planejada/pendente (ready to start)
      // - finalizada (ready for proof of delivery)
      // Note: em_andamento removed - once started, no notification needed
      const { data, error } = await supabase
        .from("viagens")
        .select("id, status")
        .eq("motorista_id", motorista.id)
        .in("status", ["planejada", "pendente", "finalizada"])

      if (error) {
        console.error('Error fetching viagens notifications:', error)
        return 0
      }

      return data?.length || 0
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute to keep notifications updated
  })
}