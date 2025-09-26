import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { PermissionTemplate } from "@/types/permissions"

interface UserTemplateAssignment {
  user_id: string
  template_id: string
  assigned_at: string
  assigned_by: string | null
  permission_templates: PermissionTemplate
}

export const useUserPermissionTemplates = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Buscar template atribuído ao usuário atual (se for subconta)
  const userTemplateQuery = useQuery({
    queryKey: ["user-permission-template", user?.id],
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

  // Atribuir template a um usuário
  const assignTemplateMutation = useMutation({
    mutationFn: async ({ userId, templateId }: { userId: string; templateId: string }) => {
      const { error } = await supabase
        .from("user_permission_templates")
        .upsert({
          user_id: userId,
          template_id: templateId,
          assigned_by: user?.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permission-template"] })
      toast.success("Template de permissões atribuído com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atribuir template:", error)
      toast.error("Erro ao atribuir template de permissões")
    }
  })

  // Remover atribuição de template
  const removeTemplateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_permission_templates")
        .delete()
        .eq("user_id", userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permission-template"] })
      toast.success("Template de permissões removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover template:", error)
      toast.error("Erro ao remover template de permissões")
    }
  })

  return {
    userTemplate: userTemplateQuery.data,
    isLoading: userTemplateQuery.isLoading,
    assignTemplate: assignTemplateMutation.mutate,
    isAssigning: assignTemplateMutation.isPending,
    removeTemplate: removeTemplateMutation.mutate,
    isRemoving: removeTemplateMutation.isPending
  }
}