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
        result = await createSaida(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateSaida(supabaseClient, user.id, data)
        break
      case 'delete':
        result = await deleteSaida(supabaseClient, user.id, data.id)
        break
      case 'update_status':
        result = await updateSaidaStatus(supabaseClient, user.id, data)
        break
      case 'approve':
        result = await approveSaida(supabaseClient, user.id, data)
        break
      case 'allocate_viagem':
        result = await allocateToViagem(supabaseClient, user.id, data)
        break
      case 'deallocate_viagem':
        result = await deallocateFromViagem(supabaseClient, user.id, data.saidaId)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-saidas:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createSaida(supabase: any, userId: string, data: any) {
  if (!data.data_saida || !data.itens || data.itens.length === 0) {
    throw new Error('Missing required fields')
  }

  // Validate deposito_id for FEFO traceability
  if (!data.deposito_id) {
    throw new Error('deposito_id é obrigatório para rastreabilidade FEFO')
  }

  // Calculate total weight
  const pesoTotal = data.itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)

  // Create saida data excluding itens and reserva_id
  const { itens, reserva_id, ...saidaFields } = data
  const saidaData = {
    user_id: userId,
    ...saidaFields,
    peso_total: pesoTotal,
    status: 'separacao_pendente',
    status_aprovacao_produtor: userId === data.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: saida, error: saidaError } = await supabase
    .from('saidas')
    .insert(saidaData)
    .select()
    .single()

  if (saidaError) throw saidaError

  try {
    // Update reservation if provided
    if (reserva_id) {
      const { error: reservaError } = await supabase
        .from('reservas_horario')
        .update({ saida_id: saida.id })
        .eq('id', reserva_id)
      
      if (reservaError) {
        console.error('Error updating reservation:', reservaError)
        // Don't fail the entire operation for reservation update error
      }
    }

    // Insert items with FEFO allocation
    const itensInseridos = []
    
    for (const item of data.itens) {
      // Insert saida_item
      const { data: saidaItem, error: itemError } = await supabase
        .from('saida_itens')
        .insert({
          ...item,
          saida_id: saida.id,
          user_id: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (itemError) {
        throw new Error(`Erro ao criar item: ${itemError.message}`)
      }

      // Allocate stock using FEFO
      const { data: alocacaoResult, error: alocacaoError } = await supabase
        .rpc('validar_e_alocar_estoque_fefo', {
          p_produto_id: item.produto_id,
          p_deposito_id: data.deposito_id,
          p_quantidade_necessaria: item.quantidade,
          p_saida_item_id: saidaItem.id
        })

      if (alocacaoError) {
        throw new Error(`Erro ao alocar estoque FEFO: ${alocacaoError.message}`)
      }

      console.log(`FEFO allocation for product ${item.produto_id}:`, alocacaoResult)
      
      // Buscar o lote das reservas criadas pela alocação FEFO
      const { data: reservas, error: reservasError } = await supabase
        .from('estoque_reservas')
        .select('lote')
        .eq('saida_id', saida.id)
        .eq('produto_id', item.produto_id)
        .order('created_at', { ascending: true })
        .limit(1)
      
      // Atualizar o saida_item com o lote da primeira reserva
      if (reservas && reservas.length > 0 && reservas[0].lote) {
        await supabase
          .from('saida_itens')
          .update({ lote: reservas[0].lote })
          .eq('id', saidaItem.id)
        
        saidaItem.lote = reservas[0].lote
        console.log(`Updated saida_item ${saidaItem.id} with lote: ${reservas[0].lote}`)
      }
      
      itensInseridos.push(saidaItem)
    }

    return { ...saida, itens: itensInseridos }
  } catch (error) {
    // If any error occurs after saida creation, clean up
    console.error('Error creating saida, rolling back:', error)
    await supabase.from('saidas').delete().eq('id', saida.id)
    throw error
  }
}

async function updateSaida(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function deleteSaida(supabase: any, userId: string, saidaId: string) {
  const { error } = await supabase
    .from('saidas')
    .delete()
    .eq('id', saidaId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: saidaId }
}

async function updateSaidaStatus(supabase: any, userId: string, data: any) {
  const { id, status, observacoes } = data
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      status,
      observacoes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function approveSaida(supabase: any, userId: string, data: any) {
  const { id, status_aprovacao, observacoes } = data
  
  const updateData: any = {
    status_aprovacao_produtor: status_aprovacao,
    updated_at: new Date().toISOString()
  }

  if (observacoes) {
    updateData.observacoes = observacoes
  }

  if (status_aprovacao === 'aprovado') {
    updateData.data_aprovacao_produtor = new Date().toISOString()
  }

  const { data: saida, error } = await supabase
    .from('saidas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function allocateToViagem(supabase: any, userId: string, data: any) {
  const { viagemId, saidaId } = data
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      viagem_id: viagemId,
      status: 'alocado_viagem',
      updated_at: new Date().toISOString()
    })
    .eq('id', saidaId)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function deallocateFromViagem(supabase: any, userId: string, saidaId: string) {
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      viagem_id: null,
      status: 'expedido',
      updated_at: new Date().toISOString()
    })
    .eq('id', saidaId)
    .select()
    .single()

  if (error) throw error
  return saida
}