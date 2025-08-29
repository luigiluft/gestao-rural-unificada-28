import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useUserPagePermissions = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["user-page-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", user.id)

      if (error) throw error
      
      // Filtrar apenas permissões de visualização de páginas
      return data
        .map(item => item.permission)
        .filter(permission => permission.endsWith('.view'))
    },
    enabled: !!user?.id,
  })
}