import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface ClienteUsuario {
  id: string
  cliente_id: string
  user_id: string
  papel: 'administrador' | 'gestor' | 'operador' | 'visualizador'
  ativo: boolean
  created_at: string
  created_by: string | null
}

export interface ClienteUsuarioWithProfile extends ClienteUsuario {
  profiles: {
    user_id: string
    nome: string
    email: string | null
  }
}

/**
 * Hook para buscar usuários de um cliente específico
 */
export const useClienteUsuarios = (clienteId?: string) => {
  return useQuery({
    queryKey: ["cliente-usuarios", clienteId],
    queryFn: async (): Promise<ClienteUsuarioWithProfile[]> => {
      if (!clienteId) return []
      
      const { data, error } = await supabase
        .from("cliente_usuarios")
        .select(`
          *,
          profiles!cliente_usuarios_user_id_fkey (
            user_id,
            nome,
            email
          )
        `)
        .eq("cliente_id", clienteId)
        .eq("ativo", true)

      if (error) throw error
      return (data || []) as ClienteUsuarioWithProfile[]
    },
    enabled: !!clienteId,
  })
}

/**
 * Hook para adicionar um usuário a um cliente
 */
export const useAddUsuarioToCliente = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      userId, 
      papel = 'gestor' 
    }: { 
      clienteId: string
      userId: string
      papel?: 'administrador' | 'gestor' | 'operador' | 'visualizador'
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado")
      
      const { data, error } = await supabase
        .from("cliente_usuarios")
        .insert({
          cliente_id: clienteId,
          user_id: userId,
          papel,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-usuarios", variables.clienteId] })
      toast.success("Usuário adicionado ao cliente com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao adicionar usuário ao cliente:", error)
      toast.error("Erro ao adicionar usuário ao cliente")
    }
  })
}

/**
 * Hook para atualizar o papel de um usuário em um cliente
 */
export const useUpdateUsuarioCliente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      papel,
      clienteId
    }: { 
      id: string
      papel: 'administrador' | 'gestor' | 'operador' | 'visualizador'
      clienteId: string
    }) => {
      const { data, error } = await supabase
        .from("cliente_usuarios")
        .update({ papel })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-usuarios", variables.clienteId] })
      toast.success("Papel do usuário atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar papel do usuário:", error)
      toast.error("Erro ao atualizar papel do usuário")
    }
  })
}

/**
 * Hook para remover um usuário de um cliente (desativar)
 */
export const useRemoveUsuarioFromCliente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id,
      clienteId
    }: { 
      id: string
      clienteId: string
    }) => {
      const { data, error } = await supabase
        .from("cliente_usuarios")
        .update({ ativo: false })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-usuarios", variables.clienteId] })
      toast.success("Usuário removido do cliente com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao remover usuário do cliente:", error)
      toast.error("Erro ao remover usuário do cliente")
    }
  })
}
