import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { action, data } = await req.json()

    let result
    switch (action) {
      case 'create':
        result = await createEntrada(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateEntrada(supabaseClient, user.id, data)
        break
      case 'delete':
        result = await deleteEntrada(supabaseClient, user.id, data.id)
        break
      case 'update_status':
        result = await updateEntradaStatus(supabaseClient, user.id, data)
        break
      case 'get_franquia_coords':
        result = await getFranquiaCoords(supabaseClient, data.user_id)
        break
      case 'get_fazenda_coords':
        result = await getFazendaCoords(supabaseClient, data.fazenda_id)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-entradas:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Helper to convert empty strings to null (for date fields)
function emptyToNull(value: any): any {
  if (value === '' || value === undefined) return null
  if (typeof value === 'object' && value !== null && value._type === 'undefined') return null
  return value
}

// Helper to sanitize date fields
function sanitizeDateFields(obj: any, dateFields: string[]): any {
  const result = { ...obj }
  for (const field of dateFields) {
    if (field in result) {
      result[field] = emptyToNull(result[field])
    }
  }
  return result
}

async function createEntrada(supabase: any, userId: string, data: any) {
  // Normalize input
  if (!data.data_entrada && data.dataEntrada) {
    data.data_entrada = data.dataEntrada
  }

  // Validate required fields
  if (!data.data_entrada) {
    throw new Error('Missing required fields')
  }

  // Extract itens from data to save separately and remove unsupported fields
  const { itens, tipo: _ignoredTipo, xml_content: _xmlContent, ...entradaDataRaw } = data
  
  // Sanitize date fields - convert empty strings to null
  const dateFields = ['data_entrada', 'data_emissao', 'data_aprovacao']
  const entradaData = sanitizeDateFields(entradaDataRaw, dateFields)

  // Start transaction
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert({
      user_id: userId,
      ...entradaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (entradaError) throw entradaError

  try {
    // Insert items if provided
    if (itens && itens.length > 0) {
      const itemsWithEntradaId = itens.map((item: any) => {
        console.log('📦 Item antes de salvar:', item);
        
        // Garantir preservação de zeros e normalização de tipos
        const valorTotalTributosItem =
          typeof item?.valor_total_tributos_item === 'number'
            ? item.valor_total_tributos_item
            : (item?.valor_total_tributos_item != null
                ? parseFloat(item.valor_total_tributos_item)
                : 0);

        const impostosIpi = item?.impostos_ipi ?? null;
        
        return {
          entrada_id: entrada.id,
          user_id: userId,
          created_at: new Date().toISOString(),
          // Campos básicos
          nome_produto: item.produto || item.nome_produto,
          produto_id: emptyToNull(item.produto_id),
          codigo_produto: emptyToNull(item.codigo || item.codigo_produto),
          codigo_ean: emptyToNull(item.codigoEAN || item.codigo_ean),
          quantidade: item.quantidade,
          unidade_comercial: item.unidade || item.unidade_comercial,
          valor_unitario: item.valorUnitario || item.valor_unitario,
          valor_total: item.valorTotal || item.valor_total,
          lote: item.lote || null,
          data_validade: emptyToNull(item.dataValidade || item.data_validade),
          data_fabricacao: emptyToNull(item.dataFabricacao || item.data_fabricacao),
          // Campos tributários
          descricao_produto: item.descricao_produto || item.produto,
          ncm: emptyToNull(item.ncm),
          cest: emptyToNull(item.cest),
          cfop: emptyToNull(item.cfop),
          quantidade_comercial: emptyToNull(item.quantidade_comercial),
          valor_unitario_comercial: emptyToNull(item.valor_unitario_comercial),
          codigo_ean_tributavel: emptyToNull(item.codigo_ean_tributavel),
          unidade_tributavel: emptyToNull(item.unidade_tributavel),
          quantidade_tributavel: emptyToNull(item.quantidade_tributavel),
          valor_unitario_tributavel: emptyToNull(item.valor_unitario_tributavel),
          indicador_total: emptyToNull(item.indicador_total),
          impostos_icms: emptyToNull(item.impostos_icms),
          impostos_ipi: impostosIpi,
          impostos_pis: emptyToNull(item.impostos_pis),
          impostos_cofins: emptyToNull(item.impostos_cofins),
          valor_total_tributos_item: valorTotalTributosItem ?? 0,
        };
      })
      
      console.log('💾 Itens com tributação preparados para salvar:', itemsWithEntradaId);

      const { data: itemsData, error: itemsError } = await supabase
        .from('entrada_itens')
        .insert(itemsWithEntradaId)
        .select()

      if (itemsError) {
        console.error('❌ Erro ao salvar itens:', itemsError);
        // Rollback entrada
        await supabase.from('entradas').delete().eq('id', entrada.id)
        throw itemsError
      }
      
      console.log('✅ Itens salvos com sucesso:', itemsData);

      return { ...entrada, itens: itemsData }
    }

    return entrada
  } catch (error) {
    // If any error occurs after entrada creation, clean up
    await supabase.from('entradas').delete().eq('id', entrada.id)
    throw error
  }
}

async function updateEntrada(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: entrada, error } = await supabase
    .from('entradas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return entrada
}

async function deleteEntrada(supabase: any, userId: string, entradaId: string) {
  console.log('🗑️ Edge Function DELETE - Iniciando:', { userId, entradaId });
  
  // First, verify the entrada exists and get its details
  const { data: entrada, error: fetchError } = await supabase
    .from('entradas')
    .select('id, numero_nfe, user_id, emitente_cnpj, destinatario_cpf_cnpj')
    .eq('id', entradaId)
    .single();

  if (fetchError) {
    console.error('🗑️ Edge Function DELETE - Erro ao buscar entrada:', fetchError);
    throw fetchError;
  }

  if (!entrada) {
    console.error('🗑️ Edge Function DELETE - Entrada não encontrada:', entradaId);
    throw new Error('Entrada não encontrada');
  }

  console.log('🗑️ Edge Function DELETE - Entrada encontrada:', entrada);

  // Perform the delete with explicit ID filter only
  // RLS policies will handle authorization
  const { data: deletedData, error } = await supabase
    .from('entradas')
    .delete()
    .eq('id', entradaId)
    .select();

  console.log('🗑️ Edge Function DELETE - Resultado:', { 
    deletedCount: deletedData?.length || 0, 
    deletedIds: deletedData?.map((e: any) => e.id) || [],
    error 
  });

  if (error) {
    console.error('🗑️ Edge Function DELETE - Erro ao deletar:', error);
    throw error;
  }

  // Safety check: ensure only one record was deleted
  if (deletedData && deletedData.length > 1) {
    console.error('🗑️ Edge Function DELETE - ERRO CRÍTICO: Múltiplas entradas deletadas!', {
      count: deletedData.length,
      ids: deletedData.map((e: any) => e.id)
    });
    throw new Error(`ERRO CRÍTICO: ${deletedData.length} entradas foram deletadas ao invés de 1`);
  }

  if (!deletedData || deletedData.length === 0) {
    console.error('🗑️ Edge Function DELETE - Nenhuma entrada foi deletada');
    throw new Error('Entrada não pôde ser deletada - verifique as permissões');
  }

  console.log('🗑️ Edge Function DELETE - Sucesso:', deletedData[0]);
  return { id: entradaId, deleted: deletedData[0] };
}

async function updateEntradaStatus(supabase: any, userId: string, data: any) {
  const { id, status_aprovacao, observacoes_franqueado, divergencias } = data
  
  const updateData: any = {
    status_aprovacao,
    updated_at: new Date().toISOString()
  }

  if (observacoes_franqueado) {
    updateData.observacoes_franqueado = observacoes_franqueado
  }

  if (divergencias) {
    updateData.divergencias = divergencias
  }

  if (status_aprovacao === 'confirmado') {
    updateData.data_aprovacao = new Date().toISOString()
    updateData.aprovado_por = userId
  }

  const { data: entrada, error } = await supabase
    .from('entradas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Se há divergências, criar registros individuais na tabela divergencias
  if (divergencias && Array.isArray(divergencias) && divergencias.length > 0) {
    await createDivergenciasRecords(supabase, entrada, divergencias, userId)
  }

  return entrada
}

async function createDivergenciasRecords(supabase: any, entrada: any, divergencias: any[], userId: string) {
  try {
    const divergenciasRecords = []
    
    for (const div of divergencias) {
      // Encontrar o produto pelo nome do produto na divergência
      let produto_id = null
      if (div.produto_nome) {
        const { data: produto } = await supabase
          .from('produtos')
          .select('id')
          .ilike('nome', div.produto_nome)
          .limit(1)
          .single()
        
        if (produto) {
          produto_id = produto.id
        }
      }

      // Mapear tipo de divergência corretamente (suporta 'avaria')
      const mappedTipo = mapTipoDivergencia(div.tipo_divergencia || div.tipo);
      
      // Calculate values based on divergence type
      let quantidade_esperada = parseFloat(div.quantidade_esperada) || 0;
      let quantidade_encontrada = parseFloat(div.quantidade_recebida || div.quantidade_encontrada) || 0;
      
      // Add marker for avaria in observacoes
      let observacoes = div.observacoes || null;
      if ((div.tipo_divergencia || '').toLowerCase() === 'avaria') {
        const avariaQty = parseFloat(div.quantidade_avariada) || Math.max(0, quantidade_esperada - quantidade_encontrada) || 0;
        observacoes = `AVARIA: ${avariaQty} unidades avariadas durante transporte`;
      }

      const divergenciaRecord = {
        user_id: entrada.user_id,
        deposito_id: entrada.deposito_id,
        entrada_id: entrada.id,
        produto_id: produto_id,
        tipo_origem: 'entrada',
        tipo_divergencia: mappedTipo,
        quantidade_esperada: quantidade_esperada,
        quantidade_encontrada: quantidade_encontrada,
        lote: div.lote || null,
        observacoes: observacoes,
        status: 'pendente',
        prioridade: div.prioridade || ((div.tipo_divergencia || '').toLowerCase() === 'avaria' ? 'alta' : 'media')
      }

      divergenciasRecords.push(divergenciaRecord)
    }

    if (divergenciasRecords.length > 0) {
      const { error: divError } = await supabase
        .from('divergencias')
        .insert(divergenciasRecords)

      if (divError) {
        console.error('Error creating divergencias records:', divError)
        // Não falha a operação principal, apenas loga o erro
      } else {
        console.log(`Created ${divergenciasRecords.length} divergencias records for entrada ${entrada.id}`)
        
        // Note: Avaria pallets are now created manually through the frontend
        // No longer auto-creating avaria pallets to avoid conflicts with manual pallet creation
      }
    }
  } catch (error) {
    console.error('Error in createDivergenciasRecords:', error)
    // Não falha a operação principal, apenas loga o erro
  }
}

// Helper function to create a separate pallet for avaria items
async function createAvariaPallet(entradaId: string, divergencia: any, supabase: any) {
  try {
    // Get next pallet number
    const { data: existingPallets } = await supabase
      .from('entrada_pallets')
      .select('numero_pallet')
      .eq('entrada_id', entradaId)
      .order('numero_pallet', { ascending: false })
      .limit(1)

    const nextPalletNumber = existingPallets && existingPallets.length > 0 
      ? (existingPallets[0].numero_pallet || 0) + 1 
      : 1

    // Create pallet for avaria
    const { data: avariaPallet, error: palletError } = await supabase
      .from('entrada_pallets')
      .insert({
        entrada_id: entradaId,
        numero_pallet: nextPalletNumber,
        descricao: `Pallet ${nextPalletNumber} - Avaria`,
        quantidade_atual: Math.abs(divergencia.diferenca || 0)
      })
      .select()
      .single()

    if (palletError) {
      console.error('Error creating avaria pallet:', palletError)
      return
    }

    // Find the entrada_item_id for this product/lote
    const { data: entradaItens } = await supabase
      .from('entrada_itens')
      .select('id')
      .eq('entrada_id', entradaId)
      .eq('produto_id', divergencia.produto_id)
      .eq('lote', divergencia.lote)
      .limit(1)

    if (entradaItens && entradaItens.length > 0) {
      // Add damaged items to the avaria pallet
      const { error: itemError } = await supabase
        .from('entrada_pallet_itens')
        .insert({
          pallet_id: avariaPallet.id,
          entrada_item_id: entradaItens[0].id,
          quantidade: Math.abs(divergencia.diferenca || 0),
          is_avaria: true
        })

      if (itemError) {
        console.error('Error creating avaria pallet item:', itemError)
      } else {
        console.log('Avaria pallet created successfully:', avariaPallet.id)
      }
    }
  } catch (error) {
    console.error('Error creating avaria pallet:', error)
  }
}

// Função para mapear tipos de divergência para valores válidos
function mapTipoDivergencia(tipo: string): string {
  const tipoLower = (tipo || '').toLowerCase().trim()
  
  if (tipoLower === 'avaria' || tipoLower.includes('avaria') || tipoLower.includes('avariado')) {
    return 'avaria'
  }
  if (tipoLower.includes('faltante') || tipoLower.includes('falta')) {
    return 'produto_faltante'
  }
  if (tipoLower.includes('excedente') || tipoLower.includes('sobra')) {
    return 'produto_excedente'
  }
  if (tipoLower.includes('quantidade')) {
    return 'quantidade_incorreta'
  }
  if (tipoLower.includes('lote')) {
    return 'lote_incorreto'
  }
  if (tipoLower.includes('validade')) {
    return 'validade_incorreta'
  }
  
  // Default para quantidade incorreta
  return 'quantidade_incorreta'
}

async function getFranquiaCoords(supabase: any, userId: string) {
  console.log('🗺️ Getting franquia coords for user:', userId);
  
  const { data: franquia, error } = await supabase
    .from('franquias')
    .select('id, nome, latitude, longitude')
    .eq('master_franqueado_id', userId)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    console.error('Error getting franquia coords:', error);
    throw error;
  }

  // Return null if no franchise found (user may not be a franchise owner)
  return franquia;
}

async function getFazendaCoords(supabase: any, fazendaId: string) {
  console.log('🗺️ Getting fazenda coords for:', fazendaId);
  
  const { data: fazenda, error } = await supabase
    .from('fazendas')
    .select('id, nome, latitude, longitude')
    .eq('id', fazendaId)
    .maybeSingle();

  if (error) {
    console.error('Error getting fazenda coords:', error);
    throw error;
  }

  // Return null if no fazenda found
  return fazenda;
}