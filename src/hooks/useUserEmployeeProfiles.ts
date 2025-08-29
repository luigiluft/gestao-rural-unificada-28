import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { EmployeeProfile } from "@/types/permissions"

interface UserProfileAssignment {
  user_id: string
  profile_id: string
  assigned_at: string
  assigned_by: string | null
  employee_profiles: EmployeeProfile
}

export const useUserEmployeeProfiles = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Buscar perfil atribuído ao usuário atual (se for subconta)
  const userProfileQuery = useQuery({
    queryKey: ["user-employee-profile", user?.id],
    queryFn: async (): Promise<UserProfileAssignment | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from("user_employee_profiles")
        .select(`
          *,
          employee_profiles(*)
        `)
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) throw error
      return data as UserProfileAssignment | null
    },
    enabled: !!user?.id,
  })

  // Atribuir perfil a um usuário
  const assignProfileMutation = useMutation({
    mutationFn: async ({ userId, profileId }: { userId: string; profileId: string }) => {
      const { error } = await supabase
        .from("user_employee_profiles")
        .upsert({
          user_id: userId,
          profile_id: profileId,
          assigned_by: user?.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-employee-profile"] })
      toast.success("Perfil atribuído com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atribuir perfil:", error)
      toast.error("Erro ao atribuir perfil")
    }
  })

  // Remover atribuição de perfil
  const removeProfileMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_employee_profiles")
        .delete()
        .eq("user_id", userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-employee-profile"] })
      toast.success("Perfil removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover perfil:", error)
      toast.error("Erro ao remover perfil")
    }
  })

  return {
    userProfile: userProfileQuery.data,
    isLoading: userProfileQuery.isLoading,
    assignProfile: assignProfileMutation.mutate,
    isAssigning: assignProfileMutation.isPending,
    removeProfile: removeProfileMutation.mutate,
    isRemoving: removeProfileMutation.isPending
  }
}