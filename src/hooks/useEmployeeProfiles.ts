import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

type UserRole = 'admin' | 'franqueado' | 'produtor'
type PermissionCode = 
  | 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage' 
  | 'dashboard.view' | 'entradas.view' | 'saidas.view' | 'recebimento.view' 
  | 'alocacao.view' | 'separacao.view' | 'expedicao.view' | 'inventario.view' 
  | 'relatorios.view' | 'rastreio.view' | 'perfis-funcionarios.view'

export type EmployeeProfile = {
  id: string
  user_id: string
  role: UserRole
  nome: string
  descricao?: string
  permissions: PermissionCode[]
  is_template: boolean
  created_at: string
  updated_at: string
}

export const useEmployeeProfiles = (userRole?: UserRole) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["employee-profiles", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id || !userRole) return []
      
      const { data, error } = await supabase
        .from("employee_profiles")
        .select("*")
        .eq("role", userRole)
        .eq("is_template", true)
        .order("nome")

      if (error) throw error
      return data as EmployeeProfile[]
    },
    enabled: !!user?.id && !!userRole,
  })

  const createProfileMutation = useMutation({
    mutationFn: async (profile: Omit<EmployeeProfile, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from("employee_profiles")
        .insert({
          nome: profile.nome,
          descricao: profile.descricao,
          role: profile.role,
          permissions: profile.permissions,
          is_template: profile.is_template,
          user_id: user!.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] })
      toast.success("Perfil criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar perfil:", error)
      toast.error("Erro ao criar perfil")
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, nome, descricao, permissions, role, is_template }: { 
      id: string 
      nome?: string
      descricao?: string
      permissions?: PermissionCode[]
      role?: UserRole
      is_template?: boolean
    }) => {
      const updateData: any = {}
      if (nome !== undefined) updateData.nome = nome
      if (descricao !== undefined) updateData.descricao = descricao
      if (permissions !== undefined) updateData.permissions = permissions
      if (role !== undefined) updateData.role = role
      if (is_template !== undefined) updateData.is_template = is_template

      const { data, error } = await supabase
        .from("employee_profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] })
      toast.success("Perfil atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil")
    },
  })

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_profiles")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] })
      toast.success("Perfil removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover perfil:", error)
      toast.error("Erro ao remover perfil")
    },
  })

  return {
    profiles: profiles || [],
    isLoading,
    createProfile: createProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    deleteProfile: deleteProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isDeleting: deleteProfileMutation.isPending,
  }
}