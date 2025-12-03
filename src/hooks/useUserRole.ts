import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { UserRole } from "@/types/permissions"

export const useUserRole = () => {
  const { user } = useAuth()

  const userRoleQuery = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      return (data?.role as UserRole) || null
    },
    enabled: !!user?.id,
  })

  return {
    userRole: userRoleQuery.data,
    isLoading: userRoleQuery.isLoading,
    isAdmin: userRoleQuery.data === 'admin',
    isOperador: userRoleQuery.data === 'operador',
    isCliente: userRoleQuery.data === 'cliente',
    isConsumidor: userRoleQuery.data === 'consumidor'
  }
}