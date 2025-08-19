import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "./useProfile"

export interface PagePermission {
  page_key: string
  role: "admin" | "franqueado" | "produtor"
  can_access: boolean
  visible_in_menu: boolean
}

export const usePagePermissions = () => {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  return useQuery({
    queryKey: ["page-permissions", profile?.role],
    queryFn: async () => {
      if (!profile?.role) return []

      const { data, error } = await supabase
        .from("page_permissions")
        .select("*")
        .eq("role", profile.role)

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.role,
  })
}

export const useCanAccessPage = (pageKey: string) => {
  const { data: permissions = [], isLoading } = usePagePermissions()
  
  const permission = permissions.find(p => p.page_key === pageKey)
  
  return {
    canAccess: permission?.can_access || false,
    visibleInMenu: permission?.visible_in_menu || false,
    isLoading
  }
}

export const useAllPagePermissions = () => {
  return useQuery({
    queryKey: ["all-page-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_permissions")
        .select("*")
        .order("page_key", { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

export const useUpdatePagePermissions = () => {
  return async (updates: { page_key: string; role: "admin" | "franqueado" | "produtor"; can_access: boolean; visible_in_menu: boolean }[]) => {
    const { error } = await supabase
      .from("page_permissions")
      .upsert(updates, { 
        onConflict: "page_key,role",
        ignoreDuplicates: false 
      })

    if (error) throw error
    return true
  }
}