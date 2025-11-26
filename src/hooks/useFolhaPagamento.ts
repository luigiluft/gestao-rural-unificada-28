import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useFranquia } from "@/contexts/FranquiaContext"
import { toast } from "sonner"

export interface FolhaPagamento {
  id: string
  user_id: string
  deposito_id: string
  salario_mensal: number
  cargo: string | null
  data_inicio: string
  data_fim: string | null
  ativo: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  profiles?: {
    nome: string
    email: string
  }
  franquias?: {
    nome: string
  }
}

export const useFolhaPagamento = () => {
  const { user } = useAuth()
  const { selectedFranquia } = useFranquia()
  
  return useQuery({
    queryKey: ['folha-pagamento', selectedFranquia?.id],
    queryFn: async () => {
      let query = supabase
        .from('folha_pagamento')
        .select(`
          *,
          profiles:user_id (nome, email),
          franquias:deposito_id (nome)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
      
      // Filtrar por depósito selecionado se não for "Todos os Depósitos"
      if (selectedFranquia?.id && selectedFranquia.id !== "ALL") {
        query = query.eq('deposito_id', selectedFranquia.id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as any[]
    },
    enabled: !!user
  })
}

export const useFolhaPagamentoMutations = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const createFolha = useMutation({
    mutationFn: async (folha: Omit<FolhaPagamento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('folha_pagamento')
        .insert([{ ...folha, created_by: user?.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento'] })
      toast.success('Folha de pagamento criada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao criar folha de pagamento: ' + error.message)
    }
  })
  
  const updateFolha = useMutation({
    mutationFn: async ({ id, ...folha }: Partial<FolhaPagamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('folha_pagamento')
        .update(folha)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento'] })
      toast.success('Folha de pagamento atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar folha de pagamento: ' + error.message)
    }
  })
  
  const deleteFolha = useMutation({
    mutationFn: async (id: string) => {
      // Inativar ao invés de deletar
      const { error } = await supabase
        .from('folha_pagamento')
        .update({ ativo: false, data_fim: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento'] })
      toast.success('Funcionário inativado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao inativar funcionário: ' + error.message)
    }
  })
  
  return {
    createFolha,
    updateFolha,
    deleteFolha
  }
}

// Hook para calcular total da folha de pagamento
export const useTotalFolhaPagamento = () => {
  const { selectedFranquia } = useFranquia()
  
  return useQuery({
    queryKey: ['total-folha-pagamento', selectedFranquia?.id],
    queryFn: async () => {
      let query = supabase
        .from('folha_pagamento')
        .select('salario_mensal')
        .eq('ativo', true)
      
      // Filtrar por depósito selecionado se não for "Todos os Depósitos"
      if (selectedFranquia?.id && selectedFranquia.id !== "ALL") {
        query = query.eq('deposito_id', selectedFranquia.id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const total = data?.reduce((sum, item) => sum + Number(item.salario_mensal || 0), 0) || 0
      return total
    }
  })
}
