import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface SolicitacaoFilial {
  id: string
  empresa_matriz_id: string
  deposito_id: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'rejeitada'
  documentos: Record<string, string>
  observacoes: string | null
  filial_id: string | null
  solicitado_por: string
  aprovado_por: string | null
  data_conclusao: string | null
  created_at: string
  updated_at: string
}

export interface SolicitacaoFilialWithRelations extends SolicitacaoFilial {
  empresa_matriz?: {
    razao_social: string
    cpf_cnpj: string
  }
  deposito?: {
    nome: string
  }
  filial?: {
    razao_social: string
    cpf_cnpj: string
  }
}

export const useSolicitacoesFilial = (filters?: { status?: string }) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["solicitacoes_filial", user?.id, filters],
    queryFn: async (): Promise<SolicitacaoFilialWithRelations[]> => {
      if (!user?.id) return []
      
      let query = supabase
        .from("solicitacoes_filial")
        .select(`
          *,
          empresa_matriz:clientes!empresa_matriz_id(razao_social, cpf_cnpj),
          deposito:franquias!deposito_id(nome),
          filial:clientes!filial_id(razao_social, cpf_cnpj)
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as SolicitacaoFilialWithRelations[]
    },
    enabled: !!user?.id,
  })
}

export const useCreateSolicitacaoFilial = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (data: {
      empresa_matriz_id: string
      deposito_id: string
      documentos: Record<string, string>
      observacoes?: string
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado")
      
      const { data: solicitacao, error } = await supabase
        .from("solicitacoes_filial")
        .insert({
          ...data,
          solicitado_por: user.id,
          status: 'pendente'
        })
        .select()
        .single()

      if (error) throw error
      return solicitacao
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_filial"] })
      toast.success("Solicitação de filial enviada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar solicitação:", error)
      toast.error("Erro ao enviar solicitação de filial")
    }
  })
}

export const useUpdateSolicitacaoFilial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<SolicitacaoFilial> & { id: string }) => {
      const { data: solicitacao, error } = await supabase
        .from("solicitacoes_filial")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return solicitacao
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_filial"] })
      toast.success("Solicitação atualizada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar solicitação:", error)
      toast.error("Erro ao atualizar solicitação")
    }
  })
}
