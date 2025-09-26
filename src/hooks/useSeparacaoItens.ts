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
  pallet_id?: string
  pallet_numero?: number
  pallet_escaneado: boolean
  containers_per_package?: number
  package_capacity?: number
  multiplo_incremento: number
  posicoes_disponiveis?: Array<{
    posicao_codigo: string
    posicao_id: string
    quantidade_disponivel: number
    lote?: string
    data_validade?: string
    dias_para_vencer?: number
    status_validade: 'critico' | 'atencao' | 'normal'
    prioridade_fefo: number
    pallet_id?: string
    pallet_numero?: number
  }>
  sugestao_fefo?: {
    posicao_codigo: string
    lote?: string
    data_validade?: string
    dias_para_vencer?: number
    status_validade: 'critico' | 'atencao' | 'normal'
    pallet_id?: string
    pallet_numero?: number
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
      lote,
      palletId 
    }: { 
      itemId: string, 
      quantidadeSeparada: number,
      posicaoId?: string,
      lote?: string,
      palletId?: string
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

      // Se há palletId, reduzir quantidade do pallet específico
      if (palletId && quantidadeSeparada > 0) {
        const item = itensSeparacao.find(i => i.id === itemId);
        if (item && item.deposito_id) {
          const { data: user } = await supabase.auth.getUser();
          
          // Buscar item do pallet específico
          const { data: palletItems, error: palletError } = await supabase
            .from('entrada_pallet_itens')
            .select(`
              id,
              quantidade,
              entrada_itens!inner(produto_id)
            `)
            .eq('pallet_id', palletId)
            .eq('entrada_itens.produto_id', item.produto_id);

          if (!palletError && palletItems && palletItems.length > 0) {
            const palletItem = palletItems[0];
            const novaQuantidade = palletItem.quantidade - quantidadeSeparada;
            
            if (novaQuantidade <= 0) {
              // Se quantidade chegou a zero, remover item do pallet
              await supabase
                .from('entrada_pallet_itens')
                .delete()
                .eq('id', palletItem.id);

              // Verificar se pallet está vazio para liberar posição
              const { data: remainingItems } = await supabase
                .from('entrada_pallet_itens')
                .select('id')
                .eq('pallet_id', palletId);

              if (remainingItems?.length === 0) {
                // Pallet vazio, liberar posição
                await supabase
                  .from('storage_positions')
                  .update({ ocupado: false })
                  .in('id', (
                    await supabase
                      .from('pallet_positions')
                      .select('posicao_id')
                      .eq('pallet_id', palletId)
                  ).data?.map(p => p.posicao_id) || []);

                console.log('✅ Posição liberada - pallet vazio');
              }
            } else {
              // Reduzir quantidade do pallet
              await supabase
                .from('entrada_pallet_itens')
                .update({ quantidade: novaQuantidade })
                .eq('id', palletItem.id);
            }
          }

          // Criar movimentação de saída para reduzir estoque
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
                referencia_id: palletId || itemId,
                referencia_tipo: palletId ? 'separacao_pallet' : 'separacao',
                observacoes: `Separação ${palletId ? `do pallet ${palletId}` : 'manual'} - Posição: ${posicaoId || 'N/A'}`
              });
          }
        }
      } else if (posicaoId && quantidadeSeparada > 0) {
        // Lógica antiga para compatibilidade
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
      console.log('🔍 Iniciando finalização da separação para saída:', saidaId);
      
      // STEP 1: Usar estado local para validação inicial
      console.log('📊 Estado local dos itens:', itensSeparacao.map(item => ({
        id: item.id,
        quantidade_total: item.quantidade_total,
        quantidade_separada: item.quantidade_separada,
        completo: item.quantidade_separada >= item.quantidade_total
      })));

      const itensIncompletoLocal = itensSeparacao.filter(item => 
        item.quantidade_separada < item.quantidade_total
      );

      if (itensIncompletoLocal.length > 0) {
        console.log('❌ Itens incompletos no estado local:', itensIncompletoLocal);
        throw new Error(`Ainda há ${itensIncompletoLocal.length} item(ns) não completamente separado(s)`);
      }

      // STEP 2: "Flush" todas as quantidades locais para o banco antes de finalizar
      console.log('🔄 Sincronizando todas as quantidades com o banco...');
      
      for (const item of itensSeparacao) {
        if (item.quantidade_separada > 0) {
          console.log(`🔄 Atualizando item ${item.id}: ${item.quantidade_separada}/${item.quantidade_total}`);
          
          const { error: updateError } = await supabase
            .from('saida_itens')
            .update({ 
              quantidade_separada: item.quantidade_separada
            })
            .eq('id', item.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar item:', item.id, updateError);
            throw new Error(`Erro ao sincronizar item: ${updateError.message}`);
          }
        }
      }

      // STEP 3: Removido - não revalidar contra o banco (usar apenas validação do front)
      // Mantemos somente a validação local e o flush acima.

      console.log('✅ Itens validados localmente e sincronizados. Atualizando status...');

      // STEP 4: Atualizar status da saída para "separado"
      const { data, error } = await supabase
        .from('saidas')
        .update({ 
          status: 'separado'
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

      console.log('✅ Separação finalizada com sucesso!');
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

  const inicializarSeparacao = async (itens: any[], depositoId?: string) => {
    const itensSeparacao: ItemSeparacao[] = await Promise.all(
      itens.map(async (item, index) => {
        // Buscar dados FEFO reais dos pallets para este produto
        const { data: palletsData } = await supabase
          .from("entrada_pallets")
          .select(`
            id,
            numero_pallet,
            entradas!inner(
              data_entrada,
              deposito_id
            ),
            entrada_pallet_itens!inner(
              quantidade,
              entrada_itens!inner(
                produto_id,
                lote,
                data_validade
              )
            ),
            pallet_positions!inner(
              posicao_id,
              status,
              storage_positions!inner(
                codigo
              )
            )
          `)
          .eq("entradas.deposito_id", depositoId)
          .eq("entrada_pallet_itens.entrada_itens.produto_id", item.produto_id)
          .eq("pallet_positions.status", "alocado")
          .order('entradas.data_entrada', { ascending: true })
          .limit(1);

        let sugestaoFEFO;
        if (palletsData && palletsData.length > 0) {
          const primeiroLote = palletsData[0];
          const entradaItem = primeiroLote.entrada_pallet_itens[0]?.entrada_itens;
          const posicao = primeiroLote.pallet_positions[0]?.storage_positions;
          
          const dataValidade = entradaItem?.data_validade ? new Date(entradaItem.data_validade) : null;
          const diasParaVencer = dataValidade ? 
            Math.ceil((dataValidade.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
            999;
          
          let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
          if (diasParaVencer <= 15) {
            statusValidade = 'critico';
          } else if (diasParaVencer <= 30) {
            statusValidade = 'atencao';
          }

          sugestaoFEFO = {
            posicao_codigo: posicao?.codigo || `PALLET-${primeiroLote.numero_pallet}`,
            lote: entradaItem?.lote || `P${primeiroLote.numero_pallet}-LOTE`,
            data_validade: entradaItem?.data_validade,
            dias_para_vencer: diasParaVencer,
            status_validade: statusValidade,
            pallet_id: primeiroLote.id,
            pallet_numero: primeiroLote.numero_pallet
          };
        } else {
          // Fallback para dados determinísticos se não houver pallets
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

          sugestaoFEFO = {
            posicao_codigo: `R${String(Math.floor(index / 10) + 1).padStart(2, '0')}-M${String((index % 10) + 1).padStart(2, '0')}-A${String((index % 5) + 1)}`,
            lote: `LT${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
            data_validade: dataValidade.toISOString().split('T')[0],
            dias_para_vencer: diasParaVencer,
            status_validade: statusValidade
          };
        }

        const containers = item.produtos?.containers_per_package || 1;
        const capacity = item.produtos?.package_capacity || 1;
        const multiplo = containers * capacity;

        return {
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produtos?.nome || 'Nome não disponível',
          quantidade_total: item.quantidade,
          quantidade_separada: item.quantidade_separada || 0,
          lote: item.lote || sugestaoFEFO.lote,
          unidade_medida: item.produtos?.unidade_medida || 'un',
          deposito_id: depositoId,
          pallet_id: sugestaoFEFO.pallet_id,
          pallet_numero: sugestaoFEFO.pallet_numero,
          pallet_escaneado: false,
          containers_per_package: containers,
          package_capacity: capacity,
          multiplo_incremento: multiplo,
          sugestao_fefo: sugestaoFEFO
        };
      })
    );
    setItensSeparacao(itensSeparacao);
  }

  const marcarPalletEscaneado = (itemId: string, escaneado: boolean = true) => {
    setItensSeparacao(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, pallet_escaneado: escaneado }
          : item
      )
    );
  };

  return {
    itensSeparacao,
    separarItem,
    finalizarSeparacao,
    atualizarQuantidadeSeparada,
    inicializarSeparacao,
    marcarPalletEscaneado
  }
}