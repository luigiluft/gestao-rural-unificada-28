import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { PermissionTemplate, UserRole } from "@/types/permissions"

// Hook mantido para backward compatibility - use usePermissionTemplates
export const useEmployeeProfiles = (userRole?: UserRole, includeHierarchy?: boolean) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Buscar templates de permissões (migrados da antiga tabela employee_profiles)
  const profilesQuery = useQuery({
    queryKey: ["employee-profiles", userRole, includeHierarchy],
    queryFn: async (): Promise<PermissionTemplate[]> => {
      if (!user?.id) return []

      let query = supabase
        .from("permission_templates")
        .select("*")
        .order("nome", { ascending: true })

      // Filtrar por target_role se especificado
      if (userRole) {
        query = query.eq("target_role", userRole)
      }

      // Se incluir hierarquia e for franqueado, incluir templates de produtores também
      if (includeHierarchy && userRole === 'franqueado') {
        query = supabase
          .from("permission_templates")
          .select("*")
          .in("target_role", ['franqueado', 'produtor'])
          .order("nome", { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error
      
      // Filter out 'motorista' records as this role no longer exists
      const filteredData = (data || []).filter((template: any) => 
        template.target_role !== 'motorista'
      ) as PermissionTemplate[]
      
      return filteredData
    },
    enabled: !!user?.id,
  })

  // Criar template de permissões
  const createProfileMutation = useMutation({
    mutationFn: async (profile: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("permission_templates")
        .insert(profile as any) // Type cast to handle Supabase types

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles", "permission-templates"] })
      toast.success("Template criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar template:", error)
      toast.error("Erro ao criar template")
    }
  })

  // Atualizar template de permissões
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PermissionTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("permission_templates")
        .update(updates as any) // Type cast to handle Supabase types
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles", "permission-templates"] })
      toast.success("Template atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar template:", error)
      toast.error("Erro ao atualizar template")
    }
  })

  // Deletar template de permissões
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("permission_templates")
        .delete()
        .eq("id", profileId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles", "permission-templates"] })
      toast.success("Template removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover template:", error)
      toast.error("Erro ao remover template")
    }
  })

  return {
    profiles: profilesQuery.data || [],
    isLoading: profilesQuery.isLoading,
    createProfile: createProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    deleteProfile: deleteProfileMutation.mutate,
    isDeleting: deleteProfileMutation.isPending
  }
}