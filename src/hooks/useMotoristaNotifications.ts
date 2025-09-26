import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useMotoristaNotifications = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["motorista-notifications", user?.id],
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

      // Count trips that need attention:
      // - planejada/pendente (ready to start)
      // - em_andamento (in progress, needs completion)
      // - finalizada (ready for proof of delivery)
      const { data, error } = await supabase
        .from("viagens")
        .select("id, status")
        .eq("motorista_id", motorista.id)
        .in("status", ["planejada", "pendente", "em_andamento", "finalizada"])

      if (error) {
        console.error('Error fetching motorista notifications:', error)
        return 0
      }

      return data?.length || 0
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute to keep notifications updated
  })
}