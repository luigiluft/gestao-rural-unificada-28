import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "./useProfile"
import { PermissionCode } from "@/types/permissions"

interface UserPermissions {
  permissions: PermissionCode[]
  isSubaccount: boolean
  isLoading: boolean
}

export const useSimplifiedPermissions = (): UserPermissions => {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  const { data, isLoading } = useQuery({
    queryKey: ["simplified-permissions", user?.id],
    queryFn: async (): Promise<{ permissions: PermissionCode[]; isSubaccount: boolean }> => {
      if (!user?.id || !profile?.role) {
        return { permissions: [], isSubaccount: false }
      }

      try {
        // Verificar se é subconta
        const { data: hierarchyData } = await supabase
          .from("user_hierarchy")
          .select("parent_user_id")
          .eq("child_user_id", user.id)
          .maybeSingle()

        const isSubaccount = !!hierarchyData?.parent_user_id

        if (isSubaccount) {
          // É subconta - buscar permissões via permission_templates
          const { data: templateAssignment } = await supabase
            .from("user_permission_templates")
            .select(`
              template_id,
              permission_templates(permissions)
            `)
            .eq("user_id", user.id)
            .maybeSingle()

          if (templateAssignment?.permission_templates) {
            return {
              permissions: templateAssignment.permission_templates.permissions as PermissionCode[],
              isSubaccount: true
            }
          }

          return { permissions: [], isSubaccount: true }
        } else {
          // É usuário master - buscar permissões via page_permissions
          const { data: pagePermissions } = await supabase
            .from("page_permissions")
            .select("page_key")
            .eq("role", profile.role)
            .eq("can_access", true)

          const permissions = pagePermissions?.map(p => `${p.page_key}.view` as PermissionCode) || []

          return { permissions, isSubaccount: false }
        }
      } catch (error) {
        console.error('Error fetching simplified permissions:', error)
        
        // Fallback for motorista role in case of permission errors
        if (profile.role === 'motorista') {
          return {
            permissions: ['proof-of-delivery.view', 'comprovantes.view'] as PermissionCode[],
            isSubaccount: false
          }
        }
        
        return { permissions: [], isSubaccount: false }
      }
    },
    enabled: !!user?.id && !!profile?.role,
  })

  return {
    permissions: data?.permissions || [],
    isSubaccount: data?.isSubaccount || false,
    isLoading
  }
}

export const useCanAccessPage = (pageKey: string) => {
  const { permissions, isLoading } = useSimplifiedPermissions()
  
  const canAccess = permissions.includes(`${pageKey}.view` as PermissionCode)
  
  return { canAccess, isLoading }
}