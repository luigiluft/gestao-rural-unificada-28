import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

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
    tipo_posicao: string
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
  return useQuery({
    queryKey: ["inventarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .select("*")
        .order("created_at", { ascending: false })

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
            descricao,
            tipo_posicao
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      deposito_id: string
      observacoes?: string
      posicoes_ids: string[]
    }) => {
      // Gerar número do inventário
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_inventory_number')

      if (numeroError) throw numeroError

      // Criar inventário
      const { data: inventario, error: inventarioError } = await supabase
        .from("inventarios")
        .insert({
          numero_inventario: numeroData,
          deposito_id: data.deposito_id,
          user_id: user?.id,
          created_by: user?.id,
          observacoes: data.observacoes,
          total_posicoes: data.posicoes_ids.length,
          status: 'iniciado'
        })
        .select()
        .single()

      if (inventarioError) throw inventarioError

      // Adicionar posições ao inventário
      const posicoes = data.posicoes_ids.map(posicaoId => ({
        inventario_id: inventario.id,
        posicao_id: posicaoId
      }))

      const { error: posicoesError } = await supabase
        .from("inventario_posicoes")
        .insert(posicoes)

      if (posicoesError) throw posicoesError

      return inventario
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
      const updateData: any = {}
      
      if (data.status) updateData.status = data.status
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes
      if (data.posicoes_conferidas !== undefined) updateData.posicoes_conferidas = data.posicoes_conferidas
      if (data.status === 'concluido') updateData.data_conclusao = new Date().toISOString()

      const { data: inventario, error } = await supabase
        .from("inventarios")
        .update(updateData)
        .eq("id", data.inventarioId)
        .select()
        .single()

      if (error) throw error
      return inventario
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      inventarioId: string
      posicaoId: string
    }) => {
      const { data: posicao, error } = await supabase
        .from("inventario_posicoes")
        .update({
          status: 'em_andamento',
          data_inicio: new Date().toISOString(),
          conferido_por: user?.id
        })
        .eq("inventario_id", data.inventarioId)
        .eq("posicao_id", data.posicaoId)
        .select()
        .single()

      if (error) throw error
      return posicao
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
  const { user } = useAuth()

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
      const { data: item, error } = await supabase
        .from("inventario_itens")
        .insert({
          ...data,
          quantidade_sistema: data.quantidade_sistema || 0,
          scaneado_por: user?.id,
          data_escaneamento: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return item
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
      // Marcar posição como concluída
      const { error: posicaoError } = await supabase
        .from("inventario_posicoes")
        .update({
          status: 'concluida',
          data_conclusao: new Date().toISOString()
        })
        .eq("inventario_id", data.inventarioId)
        .eq("posicao_id", data.posicaoId)

      if (posicaoError) throw posicaoError

      // Contar posições concluídas
      const { count, error: countError } = await supabase
        .from("inventario_posicoes")
        .select("*", { count: 'exact', head: true })
        .eq("inventario_id", data.inventarioId)
        .eq("status", "concluida")

      if (countError) throw countError

      // Atualizar contador no inventário
      const { error: updateError } = await supabase
        .from("inventarios")
        .update({
          posicoes_conferidas: count || 0
        })
        .eq("id", data.inventarioId)

      if (updateError) throw updateError

      return count
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