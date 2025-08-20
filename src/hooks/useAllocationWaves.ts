import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useAllocationWaves = () => {
  return useQuery({
    queryKey: ["allocation-waves"],
    queryFn: async () => {
      console.log('🔍 Buscando ondas de alocação...')
      
      const { data: waves, error } = await supabase
        .from("allocation_waves")
        .select(`
          *,
          allocation_wave_items(
            *,
            produtos(nome, unidade_medida),
            storage_positions(codigo, descricao)
          )
        `)
        .order("created_at", { ascending: false })

      console.log('📊 Resultado da busca:', { waves, error })
      if (error) {
        console.error('❌ Erro ao buscar ondas:', error)
        throw error
      }

      if (!waves || waves.length === 0) {
        console.log('⚠️ Nenhuma onda encontrada no resultado do Supabase')
        return []
      }

      // Get franquia names for each wave
      const wavesWithFranquias = await Promise.all(
        (waves || []).map(async (wave) => {
          console.log('🏢 Processando onda:', wave.numero_onda, 'deposito_id:', wave.deposito_id)
          if (wave.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", wave.deposito_id)
              .single()
            
            console.log('🏢 Franquia encontrada:', franquia)
            return {
              ...wave,
              franquias: franquia
            }
          }
          return wave
        })
      )

      console.log('✅ Ondas finais com franquias:', wavesWithFranquias)
      return wavesWithFranquias || []
    },
  })
}

export const useAllocationWaveById = (waveId: string) => {
  return useQuery({
    queryKey: ["allocation-wave", waveId],
    queryFn: async () => {
      const { data: wave, error } = await supabase
        .from("allocation_waves")
        .select(`
          *,
          allocation_wave_items(
            *,
            produtos(nome, unidade_medida),
            storage_positions(codigo, descricao),
            entrada_itens(lote, data_validade, valor_unitario, codigo_produto)
          )
        `)
        .eq("id", waveId)
        .single()

      if (error) throw error

      // Get franquia name
      if (wave?.deposito_id) {
        const { data: franquia } = await supabase
          .from("franquias")
          .select("nome")
          .eq("id", wave.deposito_id)
          .single()
        
        // Type assertion to add franquias property
        ;(wave as any).franquias = franquia
      }

      return wave
    },
    enabled: !!waveId,
  })
}

export const useStartAllocationWave = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ waveId, funcionarioId }: { waveId: string, funcionarioId?: string }) => {
      const { data, error } = await supabase
        .from("allocation_waves")
        .update({
          status: 'em_andamento',
          funcionario_id: funcionarioId || null,
          data_inicio: new Date().toISOString()
        })
        .eq("id", waveId)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-waves"] })
      toast({
        title: "Onda iniciada",
        description: "A onda de alocação foi iniciada com sucesso",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao iniciar onda",
        description: error.message || "Ocorreu um erro ao iniciar a onda de alocação",
        variant: "destructive",
      })
    },
  })
}

export const useAllocateItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      waveItemId,
      posicaoId,
      barcodeProduto,
      barcodePosicao
    }: {
      waveItemId: string
      posicaoId: string
      barcodeProduto: string
      barcodePosicao: string
    }) => {
      const { data, error } = await supabase.rpc('complete_allocation_and_create_stock', {
        p_wave_item_id: waveItemId,
        p_posicao_id: posicaoId,
        p_barcode_produto: barcodeProduto,
        p_barcode_posicao: barcodePosicao
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-waves"] })
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      queryClient.invalidateQueries({ queryKey: ["estoque"] })
      toast({
        title: "Item alocado",
        description: "O item foi alocado com sucesso e adicionado ao estoque",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alocar item",
        description: error.message || "Ocorreu um erro ao alocar o item",
        variant: "destructive",
      })
    },
  })
}