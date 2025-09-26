import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { PermissionTemplate } from "@/types/permissions"

interface UserTemplateAssignment {
  user_id: string
  template_id: string
  assigned_at: string
  assigned_by: string | null
  permission_templates: PermissionTemplate
}

export const useUserTemplate = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["user-template", user?.id],
    queryFn: async (): Promise<UserTemplateAssignment | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from("user_permission_templates")
        .select(`
          *,
          permission_templates(*)
        `)
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) throw error
      return data as UserTemplateAssignment | null
    },
    enabled: !!user?.id,
  })
}