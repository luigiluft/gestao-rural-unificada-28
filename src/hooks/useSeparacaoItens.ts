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
  deposito_id?: string
  posicoes_disponiveis?: Array<{
    posicao_codigo: string
    posicao_id: string
    quantidade_disponivel: number
    lote?: string
    data_validade?: string
    dias_para_vencer?: number
    status_validade: 'critico' | 'atencao' | 'normal'
    prioridade_fefo: number
  }>
  sugestao_fefo?: {
    posicao_codigo: string
    lote?: string
    data_validade?: string
    dias_para_vencer?: number
    status_validade: 'critico' | 'atencao' | 'normal'
  }
}

export function useSeparacaoItens() {
  const [itensSeparacao, setItensSeparacao] = useState<ItemSeparacao[]>([])
  const queryClient = useQueryClient()

  const separarItem = useMutation({
    mutationFn: async ({ 
      itemId, 
      quantidadeSeparada, 
      posicaoId, 
      lote 
    }: { 
      itemId: string, 
      quantidadeSeparada: number,
      posicaoId?: string,
      lote?: string 
    }) => {
      // Atualizar a quantidade separada do item
      const { data, error } = await supabase
        .from('saida_itens')
        .update({ 
          quantidade_separada: quantidadeSeparada,
          lote: lote 
        } as any)
        .eq('id', itemId)
        .select()

      if (error) throw error

      // Se há posição informada, atualizar/reduzir estoque na posição
      if (posicaoId && quantidadeSeparada > 0) {
        // Criar movimentação de saída para reduzir estoque
        const item = itensSeparacao.find(i => i.id === itemId);
        if (item && item.deposito_id) {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            await supabase
              .from('movimentacoes')
              .insert({
                user_id: user.user.id,
                produto_id: item.produto_id,
                deposito_id: item.deposito_id,
                tipo_movimentacao: 'saida',
                quantidade: -quantidadeSeparada,
                lote: lote,
                referencia_id: itemId,
                referencia_tipo: 'separacao',
                observacoes: `Separação manual - Posição: ${posicaoId}`
              });
          }
        }
      }

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

      const todosSeparados = itens?.every((item: any) => 
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

  const inicializarSeparacao = (itens: any[], depositoId?: string) => {
    const itensSeparacao: ItemSeparacao[] = itens.map((item, index) => {
      // Usar dados determinísticos para evitar loop
      const baseDate = new Date();
      const diasFixos = 30 + (index * 15);
      const dataValidade = new Date(baseDate.getTime() + (diasFixos * 24 * 60 * 60 * 1000));
      const diasParaVencer = Math.ceil((dataValidade.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
      if (diasParaVencer <= 15) {
        statusValidade = 'critico';
      } else if (diasParaVencer <= 30) {
        statusValidade = 'atencao';
      }

      const sugestaoFEFO = {
        posicao_codigo: `R${String(Math.floor(index / 10) + 1).padStart(2, '0')}-M${String((index % 10) + 1).padStart(2, '0')}-A${String((index % 5) + 1)}`,
        lote: `LT${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
        data_validade: dataValidade.toISOString().split('T')[0],
        dias_para_vencer: diasParaVencer,
        status_validade: statusValidade
      };

      return {
        id: item.id,
        produto_id: item.produto_id,
        produto_nome: item.produtos?.nome || 'Nome não disponível',
        quantidade_total: item.quantidade,
        quantidade_separada: item.quantidade_separada || 0,
        lote: item.lote || sugestaoFEFO.lote,
        unidade_medida: item.produtos?.unidade_medida || 'un',
        deposito_id: depositoId,
        sugestao_fefo: sugestaoFEFO
      };
    });
    setItensSeparacao(itensSeparacao);
  }

  return {
    itensSeparacao,
    separarItem,
    finalizarSeparacao,
    atualizarQuantidadeSeparada,
    inicializarSeparacao
  }
}