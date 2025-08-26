import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Função para buscar ondas de alocação baseadas em pallets (múltiplas ondas)
export const usePalletAllocationWaves = () => {
  return useQuery({
    queryKey: ["pallet-allocation-waves"],
    queryFn: async () => {
      console.log('🔍 Buscando ondas de alocação de pallets...')
      
      // Query simplificada primeiro
      const { data, error } = await supabase
        .from("allocation_waves")
        .select("*")
        .neq("status", "concluido")
        .order("created_at", { ascending: false })

      console.log('📊 Resultado da busca ondas:', { data, error })
      
      if (error) {
        console.error('❌ Erro ao buscar ondas:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma onda encontrada')
        return []
      }

      // Enriquecer com nome da franquia e contagens de pallets
      const enrichedData = await Promise.all(
        data.map(async (wave) => {
          // Buscar nome da franquia
          const { data: franquia } = await supabase
            .from("franquias")
            .select("nome")
            .eq("id", wave.deposito_id)
            .single()

          // Buscar contagem total de pallets
          const { count: totalPallets } = await supabase
            .from("allocation_wave_pallets")
            .select("*", { count: 'exact', head: true })
            .eq("wave_id", wave.id)

          // Buscar contagem de pallets alocados
          const { count: palletsAlocados } = await supabase
            .from("allocation_wave_pallets")
            .select("*", { count: 'exact', head: true })
            .eq("wave_id", wave.id)
            .in("status", ["alocado", "com_divergencia"])

          return {
            ...wave,
            franquia_nome: franquia?.nome || "Franquia não encontrada",
            total_pallets: totalPallets || 0,
            pallets_alocados: palletsAlocados || 0,
          }
        })
      )

      console.log('✅ Ondas enriquecidas:', enrichedData)
      return enrichedData
    },
  })
}

// Função para buscar uma onda específica por ID (objeto único)
export const usePalletAllocationWaveById = (waveId: string) => {
  return useQuery({
    queryKey: ["pallet-allocation-wave", waveId],
    queryFn: async () => {
      try {
        // Buscar a onda básica primeiro
        const { data: waveData, error: waveError } = await supabase
          .from("allocation_waves")
          .select("*")
          .eq("id", waveId)
          .maybeSingle()

        if (waveError) throw waveError
        if (!waveData) return null

        // Buscar pallets da onda
        const { data: palletsData, error: palletsError } = await supabase
          .from("allocation_wave_pallets")
          .select("*")
          .eq("wave_id", waveId)

        if (palletsError) throw palletsError

        // Enriquecer pallets com dados completos
        const palletsWithDetails = await Promise.all(
          (palletsData || []).map(async (pallet) => {
            // Buscar dados do entrada_pallet
            const { data: entradaPallet } = await supabase
              .from("entrada_pallets")
              .select(`
                id,
                numero_pallet,
                descricao,
                entrada_pallet_itens (
                  quantidade,
                  entrada_itens (
                    produto_id,
                    nome_produto,
                    lote,
                    quantidade,
                    valor_unitario,
                    data_validade
                  )
                )
              `)
              .eq("id", pallet.entrada_pallet_id)
              .maybeSingle()

            // Buscar posição se existe
            let position = null
            if (pallet.posicao_id) {
              const { data: pos } = await supabase
                .from("storage_positions")
                .select("id, codigo, ocupado")
                .eq("id", pallet.posicao_id)
                .maybeSingle()
              position = pos
            }

            return {
              ...pallet,
              entrada_pallets: entradaPallet,
              storage_positions: position
            }
          })
        )

        // Buscar nome da franquia
        const { data: franquia } = await supabase
          .from("franquias")
          .select("nome")
          .eq("id", waveData.deposito_id)
          .maybeSingle()

        return {
          ...waveData,
          allocation_wave_pallets: palletsWithDetails,
          franquia_nome: franquia?.nome || "Franquia não encontrada"
        }
      } catch (error) {
        console.error('Error fetching wave data:', error)
        throw error
      }
    },
    enabled: !!waveId,
  })
}

// Legacy function - manter para compatibilidade
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
            storage_positions(codigo, descricao),
            entrada_itens(lote, data_validade, valor_unitario, codigo_produto)
          )
        `)
        .neq('status', 'concluido')
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

// Mutation hook para alocar um pallet
export const useAllocatePallet = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      wavePalletId,
      posicaoId,
      barcodePallet,
      barcodePosicao,
      produtosConferidos,
      divergencias = []
    }: {
      wavePalletId: string
      posicaoId: string
      barcodePallet: string
      barcodePosicao: string
      produtosConferidos: any[]
      divergencias?: any[]
    }) => {
      console.log("🔄 MUTATION useAllocatePallet - INÍCIO")
      console.log("📤 Parâmetros recebidos na mutation:")
      console.log("  - wavePalletId:", wavePalletId)
      console.log("  - posicaoId:", posicaoId)
      console.log("  - barcodePallet:", barcodePallet)
      console.log("  - barcodePosicao:", barcodePosicao)
      console.log("  - produtosConferidos:", produtosConferidos)
      console.log("  - divergencias:", divergencias)

      console.log("🔄 Chamando RPC complete_pallet_allocation_and_create_stock_debug...")

      const { data, error } = await supabase.rpc(
        "complete_pallet_allocation_and_create_stock_debug",
        {
          p_wave_pallet_id: wavePalletId,
          p_posicao_id: posicaoId,
          p_barcode_pallet: barcodePallet,
          p_barcode_posicao: barcodePosicao,
          p_produtos_conferidos: produtosConferidos,
          p_divergencias: divergencias,
        }
      )

      console.log("📥 Resposta da RPC:")
      console.log("  - data:", data)
      console.log("  - error:", error)

      if (error) {
        console.error("❌ ERRO na RPC complete_pallet_allocation_and_create_stock_debug:")
        console.error("  - message:", error.message)
        console.error("  - details:", error.details)
        console.error("  - hint:", error.hint)
        console.error("  - code:", error.code)
        console.error("  - erro completo:", error)
        throw error
      }

      console.log("✅ RPC executada com sucesso, retornando data:", data)
      return data
    },
    onSuccess: (data) => {
      console.log("🎉 MUTATION useAllocatePallet - SUCESSO")
      console.log("📊 Data retornada:", data)
      toast({
        title: "Pallet alocado",
        description: "Pallet alocado com sucesso!",
      })
      queryClient.invalidateQueries({ queryKey: ["allocation-waves"] })
      queryClient.invalidateQueries({ queryKey: ["pallet-allocation-waves"] })
    },
    onError: (error: any) => {
      console.error('❌ MUTATION useAllocatePallet - ERRO:')
      console.error('Tipo do erro:', error.constructor.name)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      console.error('Code:', error.code)
      console.error('Erro completo:', error)
      
      toast({
        title: "Erro na alocação",
        description: error.message || "Erro ao alocar pallet",
        variant: "destructive",
      })
    },
  })
}

// Legacy function - manter para compatibilidade
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

export const useResetWavePositions = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (waveId: string) => {
      const { data, error } = await supabase.rpc('reset_wave_positions', {
        p_wave_id: waveId
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-waves"] })
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      toast({
        title: "Posições resetadas",
        description: "As posições da onda foram resetadas e realocadas com sucesso",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar posições",
        description: error.message || "Ocorreu um erro ao resetar as posições",
        variant: "destructive",
      })
    },
  })
}

// Hook para definir posições manualmente
export const useDefineWavePositions = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const defineWavePositions = async (waveId: string) => {
    console.log(`Iniciando definição de posições para onda: ${waveId}`)
    
    const startTime = Date.now()
    const { data, error } = await supabase.rpc('define_wave_positions', {
      p_wave_id: waveId
    })
    const endTime = Date.now()
    
    console.log(`Definição de posições concluída em ${endTime - startTime}ms`)
    console.log('Resultado:', data)
    
    if (error) {
      console.error('Erro na RPC define_wave_positions:', error)
      throw error
    }
    return data
  }

  return useMutation({
    mutationFn: ({ waveId }: { waveId: string }) => defineWavePositions(waveId),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["allocation-waves"] })
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] })
      
      if (result?.success) {
        toast({
          title: "Posições definidas com sucesso",
          description: `${result.allocated_items || 0} de ${result.total_items || 0} posições foram definidas`,
        })
      } else {
        console.error('Falha na definição de posições:', result)
        toast({
          title: "Falha ao definir posições",
          description: result?.message || "Não foi possível definir as posições. Verifique se há posições suficientes disponíveis.",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      console.error('Erro completo:', error)
      
      let errorMessage = "Ocorreu um erro inesperado ao definir as posições"
      
      if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = "Operação demorou muito para ser concluída. Tente novamente."
        } else if (error.message.includes('insufficient')) {
          errorMessage = "Não há posições suficientes disponíveis no depósito"
        } else if (error.message.includes('permission')) {
          errorMessage = "Permissão negada para definir posições"
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Erro ao definir posições",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })
}