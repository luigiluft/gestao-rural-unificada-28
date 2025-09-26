import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { PermissionTemplate, UserRole } from "@/types/permissions"

export const usePermissionTemplates = (userRole?: UserRole, includeHierarchy?: boolean) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Buscar templates de permissões
  const templatesQuery = useQuery({
    queryKey: ["permission-templates", userRole, includeHierarchy],
    queryFn: async (): Promise<PermissionTemplate[]> => {
      if (!user?.id) return []

      let query = supabase
        .from("permission_templates")
        .select("*")
        .order("nome", { ascending: true })

      // Filtrar por role se especificado
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
  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("permission_templates")
        .insert(template as any) // Type cast to handle Supabase types

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-templates"] })
      toast.success("Template de permissões criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar template:", error)
      toast.error("Erro ao criar template de permissões")
    }
  })

  // Atualizar template de permissões
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PermissionTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("permission_templates")
        .update(updates as any) // Type cast to handle Supabase types
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-templates"] })
      toast.success("Template atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar template:", error)
      toast.error("Erro ao atualizar template")
    }
  })

  // Deletar template de permissões
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("permission_templates")
        .delete()
        .eq("id", templateId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-templates"] })
      toast.success("Template removido com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover template:", error)
      toast.error("Erro ao remover template")
    }
  })

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutate,
    isDeleting: deleteTemplateMutation.isPending
  }
}