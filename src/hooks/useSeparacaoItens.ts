import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface ItemSeparacao {
  id: string
  produto_id: string
  produto_nome: string
  quantidade_total: number
  quantidade_separada: number
  lote?: string
  unidade_medida: string
}

export function useSeparacaoItens() {
  const [itensSeparacao, setItensSeparacao] = useState<ItemSeparacao[]>([])
  const queryClient = useQueryClient()

  const separarItem = useMutation({
    mutationFn: async ({ itemId, quantidadeSeparada }: { itemId: string, quantidadeSeparada: number }) => {
      // Atualizar a quantidade separada do item
      const { data, error } = await supabase
        .from('saida_itens')
        .update({ quantidade_separada: quantidadeSeparada })
        .eq('id', itemId)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Item separado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['saidas-pendentes'] })
    },
    onError: (error) => {
      console.error('Erro ao separar item:', error)
      toast.error('Erro ao separar item')
    }
  })

  const finalizarSeparacao = useMutation({
    mutationFn: async ({ saidaId }: { saidaId: string }) => {
      // Verificar se todos os itens foram separados
      const { data: itens, error: itensError } = await supabase
        .from('saida_itens')
        .select('quantidade, quantidade_separada')
        .eq('saida_id', saidaId)

      if (itensError) throw itensError

      const todosSeparados = itens?.every(item => 
        (item.quantidade_separada || 0) >= item.quantidade
      )

      if (!todosSeparados) {
        throw new Error('Nem todos os itens foram separados completamente')
      }

      // Atualizar status da saída para "separado"
      const { data, error } = await supabase
        .from('saidas')
        .update({ 
          status: 'separado',
          updated_at: new Date().toISOString()
        })
        .eq('id', saidaId)
        .select()

      if (error) throw error

      // Registrar no histórico de status
      await supabase
        .from('saida_status_historico')
        .insert({
          saida_id: saidaId,
          status_anterior: 'separacao_pendente',
          status_novo: 'separado',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          observacoes: 'Separação concluída individualmente'
        })

      return data
    },
    onSuccess: () => {
      toast.success('Separação finalizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['saidas-pendentes'] })
      queryClient.invalidateQueries({ queryKey: ['saidas'] })
    },
    onError: (error: any) => {
      console.error('Erro ao finalizar separação:', error)
      toast.error(error.message || 'Erro ao finalizar separação')
    }
  })

  const atualizarQuantidadeSeparada = (itemId: string, quantidade: number) => {
    setItensSeparacao(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantidade_separada: Math.min(quantidade, item.quantidade_total) }
          : item
      )
    )
  }

  const inicializarSeparacao = (itens: any[]) => {
    const itensSeparacao: ItemSeparacao[] = itens.map(item => ({
      id: item.id,
      produto_id: item.produto_id,
      produto_nome: item.produtos?.nome || 'Nome não disponível',
      quantidade_total: item.quantidade,
      quantidade_separada: item.quantidade_separada || 0,
      lote: item.lote,
      unidade_medida: item.produtos?.unidade_medida || 'un'
    }))
    setItensSeparacao(itensSeparacao)
  }

  return {
    itensSeparacao,
    separarItem,
    finalizarSeparacao,
    atualizarQuantidadeSeparada,
    inicializarSeparacao
  }
}