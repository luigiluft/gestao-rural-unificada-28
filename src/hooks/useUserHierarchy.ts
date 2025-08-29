import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useUserHierarchy = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["user-hierarchy", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isMaster: false, hasParent: false }
      
      // Verificar se o usuário tem um parent na hierarquia
      const { data: hierarchyData, error } = await supabase
        .from("user_hierarchy")
        .select("parent_user_id")
        .eq("child_user_id", user.id)
        .maybeSingle()

      if (error) throw error
      
      const hasParent = !!hierarchyData?.parent_user_id
      const isMaster = !hasParent // Se não tem parent, é master
      
      return { isMaster, hasParent }
    },
    enabled: !!user?.id,
  })
}