import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface EmpresaCliente {
  id: string
  empresa_id: string
  cliente_id: string
  tipo_relacionamento: string
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  cliente: {
    id: string
    razao_social: string
    nome_fantasia: string | null
    cpf_cnpj: string
    tipo_cliente: string
    email_comercial: string | null
    telefone_comercial: string | null
    cidade_fiscal: string | null
    estado_fiscal: string | null
  }
  empresa: {
    id: string
    razao_social: string
    nome_fantasia: string | null
  }
}

export const useEmpresaClientes = (empresaId?: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["empresa-clientes", empresaId, user?.id],
    queryFn: async () => {
      if (!user?.id || !empresaId) return []

      // Usar função RPC que bypassa RLS para buscar clientes vinculados
      const { data, error } = await supabase
        .rpc('buscar_empresa_clientes', { p_empresa_id: empresaId })

      if (error) {
        console.error("Erro ao buscar empresa clientes:", error)
        throw error
      }

      // Transformar o resultado da RPC para o formato esperado
      return (data || []).map((row: any) => ({
        id: row.id,
        empresa_id: row.empresa_id,
        cliente_id: row.cliente_id,
        tipo_relacionamento: row.tipo_relacionamento,
        observacoes: row.observacoes,
        ativo: row.ativo,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        cliente: {
          id: row.cliente_id,
          razao_social: row.cliente_razao_social,
          nome_fantasia: row.cliente_nome_fantasia,
          cpf_cnpj: row.cliente_cpf_cnpj,
          tipo_cliente: row.cliente_tipo,
          email_comercial: row.cliente_email,
          telefone_comercial: row.cliente_telefone,
          cidade_fiscal: row.cliente_cidade,
          estado_fiscal: row.cliente_estado,
        },
        empresa: null, // Não retornado pela RPC, mas não é usado na listagem
      })) as EmpresaCliente[]
    },
    enabled: !!user?.id && !!empresaId,
  })
}

export const useCreateEmpresaCliente = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      empresa_id: string
      cliente_id: string
      tipo_relacionamento?: string
      observacoes?: string
    }) => {
      const { data: result, error } = await supabase
        .from("empresa_clientes")
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-clientes"] })
      toast.success("Cliente vinculado com sucesso!")
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Este cliente já está vinculado a esta empresa")
      } else {
        toast.error("Erro ao vincular cliente: " + error.message)
      }
    },
  })
}

export const useRemoveEmpresaCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("empresa_clientes")
        .update({ ativo: false })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-clientes"] })
      toast.success("Cliente removido com sucesso!")
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover cliente: " + error.message)
    },
  })
}
