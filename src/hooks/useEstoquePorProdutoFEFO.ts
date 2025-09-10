import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstoqueFEFO {
  id: string;
  produto_id: string;
  produto_nome: string;
  deposito_id: string;
  quantidade_atual: number;
  lote?: string;
  data_validade?: string;
  data_entrada: string;
  posicao_codigo?: string;
  posicao_id?: string;
  dias_para_vencer?: number;
  prioridade_fefo: number;
  status_validade: 'critico' | 'atencao' | 'normal';
  pallet_id?: string;
  pallet_numero?: number;
}

export const useEstoquePorProdutoFEFO = (produtoId?: string, depositoId?: string) => {
  return useQuery({
    queryKey: ["estoque-fefo", produtoId, depositoId],
    queryFn: async () => {
      if (!produtoId || !depositoId) return [];

      console.log('🔍 Buscando estoque FEFO para produto:', produtoId, 'depósito:', depositoId);
      
      const estoqueFEFO: EstoqueFEFO[] = [];

      // 1. Buscar produtos que vieram de pallets alocados
      const { data: palletsData, error: palletsError } = await supabase
        .from("entrada_pallets")
        .select(`
          id,
          numero_pallet,
          descricao,
          entrada_id,
          created_at,
          entradas!inner(
            id,
            deposito_id,
            data_entrada,
            user_id
          ),
          entrada_pallet_itens!inner(
            id,
            quantidade,
            entrada_itens!inner(
              id,
              produto_id,
              nome_produto,
              lote,
              data_validade,
              valor_unitario
            )
          ),
          pallet_positions!inner(
            id,
            posicao_id,
            alocado_em,
            status,
            storage_positions!inner(
              id,
              codigo,
              ocupado
            )
          )
        `)
        .eq("entradas.deposito_id", depositoId)
        .eq("entrada_pallet_itens.entrada_itens.produto_id", produtoId)
        .eq("pallet_positions.status", "alocado");

      if (palletsError) {
        console.error('❌ Erro ao buscar pallets:', palletsError);
      } else if (palletsData && palletsData.length > 0) {
        // Processar os pallets em dados FEFO
        const palletsFEFO = palletsData.flatMap((pallet) => {
          return pallet.entrada_pallet_itens
            .filter(item => item.entrada_itens.produto_id === produtoId)
            .map((item) => {
              const entrada = pallet.entradas;
              const position = pallet.pallet_positions[0];
              const entradaItem = item.entrada_itens;
              
              // Calcular dias para vencer de forma determinística
              const dataValidade = entradaItem.data_validade ? new Date(entradaItem.data_validade) : null;
              const hoje = new Date();
              const diasParaVencer = dataValidade ? 
                Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : 
                999;
              
              let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
              if (diasParaVencer <= 15) {
                statusValidade = 'critico';
              } else if (diasParaVencer <= 30) {
                statusValidade = 'atencao';
              }

              // Sempre priorizar mostrar a posição física real
              let posicaoCodigo = position?.storage_positions?.codigo;
              
              // Se não encontrou posição, buscar na storage_positions através do posicao_id
              if (!posicaoCodigo && position?.posicao_id) {
                // A posição será buscada em uma query separada se necessário
                posicaoCodigo = `POS-${position.posicao_id.substring(0, 8)}`;
              }
              
              // Só usar fallback para pallet se realmente não encontrar posição
              if (!posicaoCodigo) {
                posicaoCodigo = `PALLET-${pallet.numero_pallet}`;
              }

              return {
                id: `pallet-${pallet.id}-item-${item.id}`,
                produto_id: entradaItem.produto_id,
                produto_nome: entradaItem.nome_produto,
                deposito_id: entrada.deposito_id,
                quantidade_atual: item.quantidade,
                lote: entradaItem.lote || `P${pallet.numero_pallet}-${entrada.id.substring(0, 8)}`,
                data_validade: entradaItem.data_validade,
                data_entrada: entrada.data_entrada,
                posicao_codigo: posicaoCodigo,
                posicao_id: position?.posicao_id,
                dias_para_vencer: diasParaVencer,
                prioridade_fefo: calcularPrioridadeFEFO(entradaItem.data_validade, entrada.data_entrada),
                status_validade: statusValidade,
                pallet_id: pallet.id,
                pallet_numero: pallet.numero_pallet
              };
            });
        });
        
        // Para pallets que não mostraram posição física, buscar as posições reais
        for (const item of palletsFEFO) {
          if (item.posicao_codigo.startsWith('POS-') || item.posicao_codigo.startsWith('PALLET-')) {
            if (item.posicao_id) {
              const { data: posicaoReal } = await supabase
                .from("storage_positions")
                .select("codigo")
                .eq("id", item.posicao_id)
                .single();
              
              if (posicaoReal?.codigo) {
                item.posicao_codigo = posicaoReal.codigo;
              }
            }
          }
        }
        
        estoqueFEFO.push(...palletsFEFO);
      }

      // 2. Buscar movimentações com posições específicas nas observações
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos(nome, unidade_medida)
        `)
        .eq("produto_id", produtoId)
        .eq("deposito_id", depositoId)
        .eq("tipo_movimentacao", "entrada")
        .gt("quantidade", 0)
        .order("data_movimentacao", { ascending: true });

      if (movError) {
        console.error('❌ Erro ao buscar movimentações:', movError);
      } else if (movimentacoes && movimentacoes.length > 0) {
        // Extrair posições das observações
        for (const mov of movimentacoes) {
          const observacao = mov.observacoes || "";
          const posicaoMatch = observacao.match(/Posição:\s*([A-Z0-9\-_]+)/i);
          
          if (posicaoMatch) {
            const codigoPosicao = posicaoMatch[1];
            
            // Buscar a posição pelo código (independente do status ocupado)
            const { data: posicao } = await supabase
              .from("storage_positions")
              .select("*")
              .eq("codigo", codigoPosicao)
              .eq("deposito_id", depositoId)
              .eq("ativo", true)
              .single();

            if (posicao) {
              // Calcular quantidade atual para este produto nesta posição
              const { data: totalMovs } = await supabase
                .from("movimentacoes")
                .select("quantidade")
                .eq("produto_id", produtoId)
                .eq("deposito_id", depositoId)
                .ilike("observacoes", `%${codigoPosicao}%`);

              const quantidadeAtual = totalMovs?.reduce((sum, m) => sum + (m.quantidade || 0), 0) || 0;

              if (quantidadeAtual > 0) {
                // Determinar data de validade
                let dataValidade: string | null = null;
                if (mov.referencia_tipo === 'entrada') {
                  const { data: entradaItem } = await supabase
                    .from("entrada_itens")
                    .select("data_validade")
                    .eq("entrada_id", mov.referencia_id)
                    .eq("produto_id", produtoId)
                    .single();
                  dataValidade = entradaItem?.data_validade || null;
                }

                const diasParaVencer = dataValidade 
                  ? Math.ceil((new Date(dataValidade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 999;

                let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
                if (diasParaVencer <= 15) {
                  statusValidade = 'critico';
                } else if (diasParaVencer <= 30) {
                  statusValidade = 'atencao';
                }

                estoqueFEFO.push({
                  id: `posicao-${posicao.id}-${mov.id}`,
                  produto_id: produtoId,
                  produto_nome: mov.produtos?.nome || '',
                  deposito_id: depositoId,
                  quantidade_atual: quantidadeAtual,
                  data_validade: dataValidade,
                  data_entrada: mov.data_movimentacao?.split('T')[0] || new Date().toISOString().split('T')[0],
                  lote: mov.lote || `POS-${codigoPosicao}`,
                  dias_para_vencer: diasParaVencer,
                  status_validade: statusValidade,
                  prioridade_fefo: calcularPrioridadeFEFO(dataValidade, mov.data_movimentacao),
                  posicao_codigo: posicao.codigo,
                  posicao_id: posicao.id,
                  pallet_id: undefined,
                  pallet_numero: undefined
                });
                break; // Só precisamos encontrar uma posição válida
              }
            }
          }
        }
      }

      // 3. Se não encontrou posições específicas, buscar posições ocupadas gerais
      if (estoqueFEFO.length === 0) {
        const { data: posicoesOcupadas } = await supabase
          .from("storage_positions")
          .select("*")
          .eq("deposito_id", depositoId)
          .eq("ocupado", true)
          .eq("ativo", true);

        // Verificar se há estoque real nessas posições
        for (const posicao of posicoesOcupadas || []) {
          const { data: estoque } = await supabase
            .from("estoque")
            .select(`
              *,
              produtos(nome, unidade_medida)
            `)
            .eq("produto_id", produtoId)
            .eq("deposito_id", depositoId)
            .gt("quantidade_atual", 0)
            .single();

          if (estoque) {
            const diasParaVencer = estoque.data_validade 
              ? Math.ceil((new Date(estoque.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 999;
            
            let statusValidade: 'critico' | 'atencao' | 'normal' = 'normal';
            if (diasParaVencer <= 15) {
              statusValidade = 'critico';
            } else if (diasParaVencer <= 30) {
              statusValidade = 'atencao';
            }
            
            estoqueFEFO.push({
              id: `estoque-${posicao.id}`,
              produto_id: produtoId,
              produto_nome: estoque.produtos?.nome || '',
              deposito_id: depositoId,
              quantidade_atual: estoque.quantidade_atual,
              data_validade: estoque.data_validade,
              data_entrada: new Date().toISOString().split('T')[0],
              lote: estoque.lote || `EST-${posicao.codigo}`,
              dias_para_vencer: diasParaVencer,
              status_validade: statusValidade,
              prioridade_fefo: calcularPrioridadeFEFO(estoque.data_validade, new Date().toISOString()),
              posicao_codigo: posicao.codigo,
              posicao_id: posicao.id,
              pallet_id: undefined,
              pallet_numero: undefined
            });
            break; // Só precisamos de uma posição
          }
        }
      }

      // 4. Se ainda não encontrou nada, buscar no estoque geral (fallback)
      if (estoqueFEFO.length === 0) {
        const { data: estoqueData, error: estoqueError } = await supabase
          .from("estoque")
          .select(`
            produto_id,
            deposito_id,
            quantidade_atual,
            produtos!inner(nome)
          `)
          .eq("produto_id", produtoId)
          .eq("deposito_id", depositoId)
          .gt("quantidade_atual", 0);

        if (!estoqueError && estoqueData && estoqueData.length > 0) {
          const estoqueGenerico = estoqueData.map((estoque, index) => ({
            id: `estoque-${estoque.produto_id}-${index}`,
            produto_id: estoque.produto_id,
            produto_nome: estoque.produtos.nome,
            deposito_id: estoque.deposito_id,
            quantidade_atual: estoque.quantidade_atual,
            lote: "SEM LOTE",
            data_validade: undefined,
            data_entrada: new Date().toISOString().split('T')[0],
            posicao_codigo: "SEM POSIÇÃO",
            posicao_id: undefined,
            dias_para_vencer: 999,
            prioridade_fefo: calcularPrioridadeFEFO(undefined, new Date().toISOString()),
            status_validade: 'normal' as const,
            pallet_id: undefined,
            pallet_numero: undefined
          }));
          estoqueFEFO.push(...estoqueGenerico);
        }
      }

      // Ordenar por prioridade FEFO (data de validade ASC, depois data de entrada ASC)
      const estoqueFEFOOrdenado = estoqueFEFO.sort((a, b) => a.prioridade_fefo - b.prioridade_fefo);
      
      console.log('✅ Estoque FEFO processado:', estoqueFEFOOrdenado);
      return estoqueFEFOOrdenado;
    },
    enabled: !!(produtoId && depositoId),
    refetchOnWindowFocus: false,
  });
};

// Função para calcular prioridade FEFO
function calcularPrioridadeFEFO(dataValidade?: string, dataEntrada?: string): number {
  let prioridade = 0;
  
  // Prioridade por data de validade (quanto menor, maior prioridade)
  if (dataValidade) {
    const vencimento = new Date(dataValidade).getTime();
    prioridade = vencimento;
  } else {
    // Se não tem validade, usar data muito distante (menor prioridade)
    prioridade = new Date('2099-12-31').getTime();
  }
  
  // Critério de desempate: data de entrada (mais antigo = maior prioridade)
  if (dataEntrada) {
    const entrada = new Date(dataEntrada).getTime();
    // Subtrair pequeno valor baseado na data de entrada para priorizar mais antigos
    prioridade -= (new Date('2099-12-31').getTime() - entrada) / 1000000;
  }
  
  return prioridade;
}