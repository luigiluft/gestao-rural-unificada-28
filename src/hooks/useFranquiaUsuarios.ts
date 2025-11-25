import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface FranquiaUsuario {
  id: string
  franquia_id: string
  user_id: string
  papel: 'master' | 'operador'
  ativo: boolean
  created_at: string
  updated_at: string
  franquias?: {
    id: string
    nome: string
    cnpj: string
  }
  profiles?: {
    user_id: string
    nome: string
    email: string
  }
}

// Hook para buscar usuários de uma franquia
export const useFranquiaUsuarios = (franquiaId?: string) => {
  return useQuery({
    queryKey: ["franquia-usuarios", franquiaId],
    queryFn: async () => {
      if (!franquiaId) return []

      const { data, error } = await supabase
        .from("franquia_usuarios")
        .select(`
          *,
          profiles!franquia_usuarios_user_id_fkey (
            user_id,
            nome,
            email
          )
        `)
        .eq("franquia_id", franquiaId)
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as FranquiaUsuario[]
    },
    enabled: !!franquiaId,
  })
}

// Hook para buscar franquias de um usuário
export const useUserFranquias = (userId?: string, limit = 50) => {
  return useQuery({
    queryKey: ["user-franquias", userId, limit],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from("franquia_usuarios")
        .select(`
          *,
          franquias!inner (
            id,
            nome,
            cnpj,
            ativo
          )
        `)
        .eq("user_id", userId)
        .eq("ativo", true)
        .limit(limit)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as FranquiaUsuario[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

// Hook para adicionar usuário a uma franquia
export const useAddFranquiaUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      franquiaId,
      userId,
      papel = 'operador'
    }: {
      franquiaId: string
      userId: string
      papel?: 'master' | 'operador'
    }) => {
      const { data, error } = await supabase
        .from("franquia_usuarios")
        .insert({
          franquia_id: franquiaId,
          user_id: userId,
          papel,
          ativo: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidação granular
      queryClient.invalidateQueries({ queryKey: ["franquia-usuarios", variables.franquiaId] })
      queryClient.invalidateQueries({ queryKey: ["user-franquias", variables.userId] })
      toast.success("Usuário adicionado à franquia com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar usuário à franquia")
    },
  })
}

// Hook para remover usuário de uma franquia
export const useRemoveFranquiaUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar dados do relacionamento antes de deletar para invalidar caches corretos
      const { data: franquiaUsuario } = await supabase
        .from("franquia_usuarios")
        .select("franquia_id, user_id")
        .eq("id", id)
        .single()

      const { error } = await supabase
        .from("franquia_usuarios")
        .update({ ativo: false })
        .eq("id", id)

      if (error) throw error
      return franquiaUsuario
    },
    onSuccess: (franquiaUsuario) => {
      // Invalidação granular
      if (franquiaUsuario) {
        queryClient.invalidateQueries({ queryKey: ["franquia-usuarios", franquiaUsuario.franquia_id] })
        queryClient.invalidateQueries({ queryKey: ["user-franquias", franquiaUsuario.user_id] })
      }
      toast.success("Usuário removido da franquia com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover usuário da franquia")
    },
  })
}

// Hook para atualizar papel do usuário na franquia
export const useUpdateFranquiaUsuarioPapel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      papel
    }: {
      id: string
      papel: 'master' | 'operador'
    }) => {
      const { data, error } = await supabase
        .from("franquia_usuarios")
        .update({ papel })
        .eq("id", id)
        .select("franquia_id, user_id")
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidação granular
      queryClient.invalidateQueries({ queryKey: ["franquia-usuarios", data.franquia_id] })
      queryClient.invalidateQueries({ queryKey: ["user-franquias", data.user_id] })
      toast.success("Papel do usuário atualizado com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar papel do usuário")
    },
  })
}
