import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "./useProfile"
import { PermissionCode } from "@/types/permissions"

// Helper function to add timeout to promises
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ])
}

interface UserPermissions {
  permissions: PermissionCode[]
  isSubaccount: boolean
  isLoading: boolean
}

export const useSimplifiedPermissions = (): UserPermissions => {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  // Flag para indicar se os dados básicos estão prontos
  const ready = !!user?.id && !!profile?.role

  const { data, isLoading: queryLoading, isFetching } = useQuery({
    queryKey: ["simplified-permissions", user?.id],
    queryFn: async (): Promise<{ permissions: PermissionCode[]; isSubaccount: boolean }> => {
      if (!user?.id || !profile?.role) {
        return { permissions: [], isSubaccount: false }
      }

      console.log('🔍 Fetching simplified permissions for:', { userId: user.id, role: profile.role })

      try {
        // Wrap entire query in 5s timeout
        const result = await withTimeout(
          (async () => {
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

              let permissions: PermissionCode[] = []

              if (templateAssignment?.permission_templates?.permissions) {
                permissions = templateAssignment.permission_templates.permissions as PermissionCode[]
              } else if (templateAssignment?.template_id) {
                // Fallback: buscar template diretamente se o join falhou
                const { data: template } = await supabase
                  .from("permission_templates")
                  .select("permissions")
                  .eq("id", templateAssignment.template_id)
                  .maybeSingle()
                
                if (template?.permissions) {
                  permissions = template.permissions as PermissionCode[]
                }
              }

              // Fallback específico para motoristas
              if (permissions.length === 0 && profile.role === 'motorista') {
                permissions = ['proof-of-delivery.view', 'comprovantes.view'] as PermissionCode[]
              }

              console.log('✅ Subaccount permissions:', permissions.slice(0, 5))
              return { permissions, isSubaccount: true }
            } else {
              // É usuário master - buscar permissões via page_permissions
              const { data: pagePermissions } = await supabase
                .from("page_permissions")
                .select("page_key")
                .eq("role", profile.role)
                .eq("can_access", true)

              const permissions = pagePermissions?.map(p => `${p.page_key}.view` as PermissionCode) || []

              console.log('✅ Master user permissions:', permissions.slice(0, 5))
              return { permissions, isSubaccount: false }
            }
          })(),
          5000 // 5 second timeout
        )

        return result
      } catch (error: any) {
        console.error('❌ Error in simplified permissions:', error?.message || error)
        
        // Role-based fallback permissions
        console.log('🔄 Using role-based fallback permissions')
        const fallbackPermissions: Record<string, PermissionCode[]> = {
          'admin': ['dashboard.view', 'entradas.view', 'estoque.view', 'saidas.view', 'empresas.view'] as PermissionCode[],
          'operador': ['dashboard.view', 'entradas.view', 'estoque.view', 'saidas.view'] as PermissionCode[],
          'cliente': ['dashboard.view', 'rastreio.view'] as PermissionCode[],
          'motorista': ['proof-of-delivery.view', 'comprovantes.view'] as PermissionCode[]
        }
        
        return { 
          permissions: fallbackPermissions[profile.role] || ['dashboard.view'] as PermissionCode[], 
          isSubaccount: false 
        }
      }
    },
    enabled: !!user?.id && !!profile?.role,
    staleTime: 10 * 60 * 1000, // 10 minutes cache (increased)
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection (increased)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1s between retries
  })

  return {
    permissions: data?.permissions || [],
    isSubaccount: data?.isSubaccount || false,
    isLoading: !ready || queryLoading || isFetching
  }
}

export const useCanAccessPage = (pageKey: string) => {
  const { permissions, isLoading } = useSimplifiedPermissions()
  
  const canAccess = permissions.includes(`${pageKey}.view` as PermissionCode)
  
  return { canAccess, isLoading }
}