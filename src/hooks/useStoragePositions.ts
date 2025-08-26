import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useStoragePositions = (depositoId?: string) => {
  return useQuery({
    queryKey: ["storage-positions", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("storage_positions")
        .select("*")
        .eq("ativo", true)
        .order("codigo", { ascending: true })

      if (depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!depositoId,
  })
}

export const useAvailablePositions = (depositoId?: string) => {
  return useQuery({
    queryKey: ["available-positions", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("storage_positions")
        .select("*")
        .eq("ativo", true)
        .eq("ocupado", false)
        .order("codigo", { ascending: true })

      if (depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!depositoId,
  })
}

export const useCreateStoragePosition = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (positionData: {
      deposito_id: string
      codigo: string
      descricao?: string
      tipo_posicao?: string
      capacidade_maxima?: number
    }) => {
      const { data, error } = await supabase
        .from("storage_positions")
        .insert(positionData)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      toast({
        title: "Posição criada",
        description: "A posição de estoque foi criada com sucesso",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar posição",
        description: error.message || "Ocorreu um erro ao criar a posição de estoque",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateStoragePosition = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: {
        codigo?: string
        descricao?: string
        tipo_posicao?: string
        capacidade_maxima?: number
        ocupado?: boolean
        ativo?: boolean
      }
    }) => {
      const { data, error } = await supabase
        .from("storage_positions")
        .update(updates)
        .eq("id", id)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      toast({
        title: "Posição atualizada",
        description: "A posição de estoque foi atualizada com sucesso",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar posição",
        description: error.message || "Ocorreu um erro ao atualizar a posição de estoque",
        variant: "destructive",
      })
    },
  })
}

export const useBulkCreateStoragePositions = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (positionsData: {
      deposito_id: string
      positions: {
        codigo: string
        descricao?: string
        tipo_posicao?: string
        capacidade_maxima?: number
      }[]
    }) => {
      const { deposito_id, positions } = positionsData
      
      // Prepara os dados para inserção em lote
      const insertData = positions.map(pos => ({
        deposito_id,
        codigo: pos.codigo,
        descricao: pos.descricao || `Posição ${pos.codigo}`,
        tipo_posicao: pos.tipo_posicao || 'pallet',
        capacidade_maxima: pos.capacidade_maxima || 1,
        ativo: true,
        ocupado: false,
        reservado_temporariamente: false
      }))

      // Inserção em lote usando upsert para evitar duplicatas
      const { data, error } = await supabase
        .from("storage_positions")
        .upsert(insertData, { onConflict: 'deposito_id,codigo' })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      toast({
        title: "Posições criadas com sucesso",
        description: `${data?.length || 0} posições foram criadas em lote`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar posições",
        description: error.message || "Ocorreu um erro ao criar as posições de estoque",
        variant: "destructive",
      })
    },
  })
}