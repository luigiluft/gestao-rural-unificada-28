import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface BulkAddParams {
  userId: string
  franquiaIds: string[]
  papel?: 'master' | 'operador'
}

/**
 * Hook para adicionar um usuário a múltiplas franquias de uma vez
 */
export const useBulkAddFranquiaUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, franquiaIds, papel = 'operador' }: BulkAddParams) => {
      // Criar array de inserções
      const insertions = franquiaIds.map(franquiaId => ({
        franquia_id: franquiaId,
        user_id: userId,
        papel,
        ativo: true,
      }))

      const { data, error } = await supabase
        .from("franquia_usuarios")
        .insert(insertions)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["franquia-usuarios"] })
      queryClient.invalidateQueries({ queryKey: ["user-franquias"] })
      
      const count = variables.franquiaIds.length
      toast.success(`Usuário associado a ${count} ${count === 1 ? 'franquia' : 'franquias'} com sucesso!`)
    },
    onError: (error: any) => {
      console.error('Erro ao associar usuário em massa:', error)
      toast.error(error.message || "Erro ao associar usuário às franquias")
    },
  })
}
