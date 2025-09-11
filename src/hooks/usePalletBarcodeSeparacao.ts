import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface PalletInfo {
  id: string
  numero_pallet: number
  codigo_barras: string
  quantidade_atual: number
  produto_nome: string
  produto_id: string
  lote?: string
  data_validade?: string
  posicao_codigo?: string
  entrada_id: string
}

export function usePalletBarcodeSeparacao() {
  const [palletScaneado, setPalletScaneado] = useState<PalletInfo | null>(null)
  const queryClient = useQueryClient()

  const buscarPalletPorCodigo = useMutation({
    mutationFn: async (codigoBarras: string) => {
      console.log('🔍 Buscando pallet com código:', codigoBarras)
      
      const { data, error } = await supabase
        .from('entrada_pallets')
        .select(`
          id,
          numero_pallet,
          codigo_barras,
          quantidade_atual,
          entrada_id,
          entrada_pallet_itens!inner (
            quantidade,
            entrada_itens!inner (
              produto_id,
              nome_produto,
              lote,
              data_validade
            )
          ),
          pallet_positions!left (
            storage_positions!left (
              codigo
            )
          )
        `)
        .eq('codigo_barras', codigoBarras)
        .gt('quantidade_atual', 0)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Código de pallet não encontrado ou sem estoque disponível')
        }
        throw error
      }

      if (!data.entrada_pallet_itens?.[0]) {
        throw new Error('Pallet não possui itens válidos')
      }

      const item = data.entrada_pallet_itens[0]
      const palletInfo: PalletInfo = {
        id: data.id,
        numero_pallet: data.numero_pallet,
        codigo_barras: data.codigo_barras!,
        quantidade_atual: data.quantidade_atual,
        produto_nome: item.entrada_itens.nome_produto,
        produto_id: item.entrada_itens.produto_id,
        lote: item.entrada_itens.lote,
        data_validade: item.entrada_itens.data_validade,
        posicao_codigo: data.pallet_positions?.[0]?.storage_positions?.codigo,
        entrada_id: data.entrada_id
      }

      console.log('✅ Pallet encontrado:', palletInfo)
      return palletInfo
    },
    onSuccess: (data) => {
      setPalletScaneado(data)
      toast.success(`Pallet ${data.numero_pallet} encontrado!`)
    },
    onError: (error: any) => {
      console.error('❌ Erro ao buscar pallet:', error)
      toast.error(error.message || 'Erro ao buscar pallet')
      setPalletScaneado(null)
    }
  })

  const separarDoPallet = useMutation({
    mutationFn: async ({ 
      palletId, 
      saidaItemId, 
      quantidadeSeparada 
    }: { 
      palletId: string
      saidaItemId: string
      quantidadeSeparada: number 
    }) => {
      console.log('🎯 Separando do pallet:', { palletId, saidaItemId, quantidadeSeparada })

      // Atualizar a quantidade separada do item de saída
      const { error: saidaError } = await supabase
        .from('saida_itens')
        .update({ 
          quantidade_separada: quantidadeSeparada
        })
        .eq('id', saidaItemId)

      if (saidaError) throw saidaError

      // Reduzir quantidade do pallet
      const { data: palletData, error: palletError } = await supabase
        .from('entrada_pallets')
        .select('quantidade_atual')
        .eq('id', palletId)
        .single()

      if (palletError) throw palletError

      const novaQuantidadePallet = Math.max(0, palletData.quantidade_atual - quantidadeSeparada)
      
      const { error: updateError } = await supabase
        .from('entrada_pallets')
        .update({ quantidade_atual: novaQuantidadePallet })
        .eq('id', palletId)

      if (updateError) throw updateError

      // Se pallet ficou vazio, liberar posição
      if (novaQuantidadePallet === 0) {
        const { data: positions } = await supabase
          .from('pallet_positions')
          .select('posicao_id')
          .eq('pallet_id', palletId)

        if (positions?.length) {
          await supabase
            .from('storage_positions')
            .update({ ocupado: false })
            .in('id', positions.map(p => p.posicao_id))
          
          console.log('🆓 Posição liberada - pallet vazio')
        }
      }

      // Criar movimentação de saída
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        await supabase
          .from('movimentacoes')
          .insert({
            user_id: user.user.id,
            produto_id: palletScaneado?.produto_id,
            deposito_id: (await supabase.from('entradas').select('deposito_id').eq('id', palletScaneado?.entrada_id).single()).data?.deposito_id,
            tipo_movimentacao: 'saida',
            quantidade: -quantidadeSeparada,
            lote: palletScaneado?.lote,
            referencia_id: palletId,
            referencia_tipo: 'separacao_pallet',
            observacoes: `Separação via código de pallet ${palletScaneado?.codigo_barras} - Posição: ${palletScaneado?.posicao_codigo || 'N/A'}`
          })
      }

      return { novaQuantidadePallet, quantidadeSeparada }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saidas-pendentes'] })
      queryClient.invalidateQueries({ queryKey: ['entrada-pallets'] })
      
      // Atualizar info do pallet scaneado
      if (palletScaneado) {
        setPalletScaneado({
          ...palletScaneado,
          quantidade_atual: data.novaQuantidadePallet
        })
      }
      
      toast.success(`${data.quantidadeSeparada} unidades separadas com sucesso!`)
    },
    onError: (error: any) => {
      console.error('❌ Erro ao separar do pallet:', error)
      toast.error('Erro ao separar do pallet')
    }
  })

  const limparPalletScaneado = () => {
    setPalletScaneado(null)
  }

  return {
    palletScaneado,
    buscarPalletPorCodigo,
    separarDoPallet,
    limparPalletScaneado
  }
}