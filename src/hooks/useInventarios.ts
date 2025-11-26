import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useDepositoFilter } from "./useDepositoFilter"

export interface Inventario {
  id: string
  numero_inventario: string
  deposito_id: string
  user_id: string
  status: 'iniciado' | 'em_andamento' | 'concluido' | 'cancelado'
  data_inicio: string
  data_conclusao?: string
  observacoes?: string
  total_posicoes: number
  posicoes_conferidas: number
  created_at: string
  updated_at: string
  created_by: string
  franquias?: {
    nome: string
  }
}

export interface InventarioPosicao {
  id: string
  inventario_id: string
  posicao_id: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  data_inicio?: string
  data_conclusao?: string
  conferido_por?: string
  storage_positions?: {
    codigo: string
    descricao?: string
  }
}

export interface InventarioItem {
  id: string
  inventario_id: string
  posicao_id: string
  produto_id?: string
  lote?: string
  codigo_barras?: string
  quantidade_encontrada: number
  quantidade_sistema: number
  diferenca: number
  valor_unitario?: number
  observacoes?: string
  scaneado_por?: string
  data_escaneamento: string
  produtos?: {
    nome: string
    unidade_medida: string
  }
}

export const useInventarios = () => {
  const { depositoId, shouldFilter } = useDepositoFilter()

  return useQuery({
    queryKey: ["inventarios", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("inventarios")
        .select("*")
        .order("created_at", { ascending: false })

      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as any[] || []
    },
  })
}

export const useInventario = (inventarioId?: string) => {
  return useQuery({
    queryKey: ["inventario", inventarioId],
    queryFn: async () => {
      if (!inventarioId) return null

      const { data, error } = await supabase
        .from("inventarios")
        .select("*")
        .eq("id", inventarioId)
        .single()

      if (error) throw error
      return data as any
    },
    enabled: !!inventarioId,
  })
}

export const useInventarioPosicoes = (inventarioId?: string) => {
  return useQuery({
    queryKey: ["inventario-posicoes", inventarioId],
    queryFn: async () => {
      if (!inventarioId) return []

      const { data, error } = await supabase
        .from("inventario_posicoes")
        .select(`
          *,
          storage_positions (
            codigo,
            descricao
          )
        `)
        .eq("inventario_id", inventarioId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as any[] || []
    },
    enabled: !!inventarioId,
  })
}

export const useInventarioItens = (inventarioId?: string, posicaoId?: string) => {
  return useQuery({
    queryKey: ["inventario-itens", inventarioId, posicaoId],
    queryFn: async () => {
      if (!inventarioId) return []

      let query = supabase
        .from("inventario_itens")
        .select(`
          *,
          produtos (
            nome,
            unidade_medida
          )
        `)
        .eq("inventario_id", inventarioId)

      if (posicaoId) {
        query = query.eq("posicao_id", posicaoId)
      }

      const { data, error } = await query.order("created_at", { ascending: true })

      if (error) throw error
      return data as any[] || []
    },
    enabled: !!inventarioId,
  })
}

export const useCriarInventario = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      deposito_id: string
      observacoes?: string
      posicoes_ids: string[]
    }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-inventario', {
        body: {
          action: 'createInventario',
          data: {
            deposito_id: data.deposito_id,
            observacoes: data.observacoes,
            posicoes_ids: data.posicoes_ids
          }
        }
      })

      if (error || !result?.success) {
        throw new Error(result?.error || 'Erro ao criar inventário')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventarios"] })
      toast({
        title: "Inventário criado com sucesso",
        description: "O inventário foi iniciado e está pronto para conferência.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar inventário",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useAtualizarInventario = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      inventarioId: string
      status?: 'iniciado' | 'em_andamento' | 'concluido' | 'cancelado'
      observacoes?: string
      posicoes_conferidas?: number
    }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-inventario', {
        body: {
          action: 'updateInventario',
          data: {
            id: data.inventarioId,
            status: data.status,
            observacoes: data.observacoes,
            posicoes_conferidas: data.posicoes_conferidas
          }
        }
      })

      if (error || !result?.success) {
        throw new Error(result?.error || 'Erro ao atualizar inventário')
      }

      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventarios"] })
      queryClient.invalidateQueries({ queryKey: ["inventario", variables.inventarioId] })
      toast({
        title: "Inventário atualizado",
        description: "As informações do inventário foram atualizadas.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar inventário",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useIniciarPosicao = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      inventarioId: string
      posicaoId: string
    }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-inventario', {
        body: {
          action: 'updateInventarioItem',
          data: {
            inventario_id: data.inventarioId,
            posicao_id: data.posicaoId,
            status: 'em_andamento',
            data_inicio: new Date().toISOString()
          }
        }
      })

      if (error || !result?.success) {
        throw new Error(result?.error || 'Erro ao iniciar posição')
      }

      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventario-posicoes", variables.inventarioId] })
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar posição",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useAdicionarItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      inventario_id: string
      posicao_id: string
      produto_id?: string
      lote?: string
      codigo_barras?: string
      quantidade_encontrada: number
      quantidade_sistema?: number
      valor_unitario?: number
      observacoes?: string
    }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-inventario', {
        body: {
          action: 'createInventarioItem',
          data: {
            ...data,
            quantidade_sistema: data.quantidade_sistema || 0
          }
        }
      })

      if (error || !result?.success) {
        throw new Error(result?.error || 'Erro ao adicionar item')
      }

      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventario-itens", variables.inventario_id] })
      toast({
        title: "Item adicionado",
        description: "O item foi registrado no inventário.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export const useConcluirPosicao = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      inventarioId: string
      posicaoId: string
    }) => {
      const { data: result, error } = await supabase.functions.invoke('manage-inventario', {
        body: {
          action: 'finalizeInventario',
          data: {
            inventario_id: data.inventarioId,
            posicao_id: data.posicaoId
          }
        }
      })

      if (error || !result?.success) {
        throw new Error(result?.error || 'Erro ao concluir posição')
      }

      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventario-posicoes", variables.inventarioId] })
      queryClient.invalidateQueries({ queryKey: ["inventario", variables.inventarioId] })
      toast({
        title: "Posição concluída",
        description: "A conferência da posição foi finalizada.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao concluir posição",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}