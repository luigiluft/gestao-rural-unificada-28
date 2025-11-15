import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface ClienteFilial {
  id: string
  cliente_id: string
  franquia_id: string
  nome: string
  codigo_interno: string | null
  endereco_complementar: string | null
  contato_local: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ClienteFilialWithFranquia extends ClienteFilial {
  franquia?: {
    nome: string
    cnpj: string
  }
}

/**
 * Hook para buscar todas as filiais de um cliente
 */
export const useClienteFiliais = (clienteId?: string) => {
  return useQuery({
    queryKey: ["cliente-filiais", clienteId],
    queryFn: async (): Promise<ClienteFilialWithFranquia[]> => {
      if (!clienteId) return []
      
      const { data, error } = await supabase
        .from("cliente_filiais")
        .select(`
          *,
          franquia:franquias(nome, cnpj)
        `)
        .eq("cliente_id", clienteId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return (data || []) as ClienteFilialWithFranquia[]
    },
    enabled: !!clienteId,
  })
}

/**
 * Hook para buscar filiais hospedadas em uma franquia
 */
export const useClienteFiliaisPorFranquia = (franquiaId?: string) => {
  return useQuery({
    queryKey: ["cliente-filiais-franquia", franquiaId],
    queryFn: async (): Promise<ClienteFilialWithFranquia[]> => {
      if (!franquiaId) return []
      
      const { data, error } = await supabase
        .from("cliente_filiais")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .eq("franquia_id", franquiaId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return (data || []) as ClienteFilialWithFranquia[]
    },
    enabled: !!franquiaId,
  })
}

/**
 * Hook para buscar uma filial específica por ID
 */
export const useClienteFilial = (filialId?: string) => {
  return useQuery({
    queryKey: ["cliente-filial", filialId],
    queryFn: async (): Promise<ClienteFilial | null> => {
      if (!filialId) return null
      
      const { data, error } = await supabase
        .from("cliente_filiais")
        .select("*")
        .eq("id", filialId)
        .single()

      if (error) throw error
      return data as ClienteFilial | null
    },
    enabled: !!filialId,
  })
}

/**
 * Hook para criar uma nova filial
 */
export const useCreateClienteFilial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<ClienteFilial, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'ativo'>) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Usuário não autenticado")
      
      const { data: filial, error } = await supabase
        .from("cliente_filiais")
        .insert({
          ...data,
          created_by: user.user.id,
          ativo: true
        })
        .select()
        .single()

      if (error) throw error
      return filial
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-filiais", variables.cliente_id] })
      queryClient.invalidateQueries({ queryKey: ["cliente-filiais-franquia", variables.franquia_id] })
      toast.success("Filial criada com sucesso!")
    },
    onError: (error: any) => {
      console.error("Erro ao criar filial:", error)
      if (error.message?.includes("unique")) {
        toast.error("Este cliente já possui uma filial nesta franquia")
      } else {
        toast.error("Erro ao criar filial")
      }
    }
  })
}

/**
 * Hook para atualizar uma filial
 */
export const useUpdateClienteFilial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClienteFilial> & { id: string }) => {
      const { data: filial, error } = await supabase
        .from("cliente_filiais")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return filial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-filiais", data.cliente_id] })
      queryClient.invalidateQueries({ queryKey: ["cliente-filial", data.id] })
      toast.success("Filial atualizada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar filial:", error)
      toast.error("Erro ao atualizar filial")
    }
  })
}

/**
 * Hook para desativar uma filial
 */
export const useDeleteClienteFilial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: filial, error } = await supabase
        .from("cliente_filiais")
        .update({ ativo: false })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return filial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-filiais", data.cliente_id] })
      queryClient.invalidateQueries({ queryKey: ["cliente-filial", data.id] })
      toast.success("Filial desativada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao desativar filial:", error)
      toast.error("Erro ao desativar filial")
    }
  })
}
