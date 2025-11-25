import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { PermissionCode } from "@/types/permissions"

interface ComputedPermissionsResult {
  permissions: PermissionCode[]
  is_subaccount: boolean
  role: string | null
}

/**
 * Hook otimizado que usa edge function com cache de 10 minutos
 * para computar permissões do usuário
 */
export const useComputedPermissions = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["computed-permissions", user?.id],
    queryFn: async (): Promise<ComputedPermissionsResult> => {
      if (!user?.id) {
        return { permissions: [], is_subaccount: false, role: null }
      }

      try {
        // Tentar buscar do cache local primeiro
        const { data: cached, error: cacheError } = await supabase
          .from("user_computed_permissions")
          .select("permissions, is_subaccount, role, expires_at")
          .eq("user_id", user.id)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle()

        if (cached && !cacheError) {
          console.log('🎯 Using cached computed permissions')
          return {
            permissions: cached.permissions as PermissionCode[],
            is_subaccount: cached.is_subaccount,
            role: cached.role
          }
        }

        // Cache expirou ou não existe - chamar edge function
        console.log('🔄 Calling compute-permissions edge function')
        const { data, error } = await supabase.functions.invoke('compute-permissions', {
          method: 'POST'
        })

        if (error) throw error

        return {
          permissions: data.permissions as PermissionCode[],
          is_subaccount: data.is_subaccount,
          role: data.role
        }
      } catch (error: any) {
        console.error('❌ Error computing permissions:', error)
        
        // Fallback básico baseado em role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        const fallbackPermissions: Record<string, PermissionCode[]> = {
          'admin': ['dashboard.view', 'entradas.view', 'estoque.view', 'saidas.view', 'empresas.view'] as PermissionCode[],
          'franqueado': ['dashboard.view', 'entradas.view', 'estoque.view', 'saidas.view'] as PermissionCode[],
          'produtor': ['dashboard.view', 'rastreio.view'] as PermissionCode[],
          'motorista': ['proof-of-delivery.view', 'comprovantes.view'] as PermissionCode[]
        }

        return {
          permissions: fallbackPermissions[profile?.role || 'produtor'] || ['dashboard.view'] as PermissionCode[],
          is_subaccount: false,
          role: profile?.role || null
        }
      }
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useCanAccessPage = (pageKey: string) => {
  const { data, isLoading } = useComputedPermissions()
  
  const canAccess = data?.permissions.includes(`${pageKey}.view` as PermissionCode) || false
  
  return { canAccess, isLoading }
}
