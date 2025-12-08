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
      if (!user?.id) return []

      let query = supabase
        .from("empresa_clientes")
        .select(`
          *,
          cliente:cliente_id(id, razao_social, nome_fantasia, cpf_cnpj, tipo_cliente, email_comercial, telefone_comercial, cidade_fiscal, estado_fiscal),
          empresa:empresa_id(id, razao_social, nome_fantasia)
        `)
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (empresaId) {
        query = query.eq("empresa_id", empresaId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as unknown as EmpresaCliente[]
    },
    enabled: !!user?.id,
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
