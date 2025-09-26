import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

  // Calculate total weight
  const pesoTotal = data.itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)

  const { data: saida, error: saidaError } = await supabase
    .from('saidas')
    .insert({
      user_id: userId,
      ...data,
      peso_total: pesoTotal,
      status: 'separacao_pendente',
      status_aprovacao_produtor: userId === data.produtor_destinatario ? 'nao_aplicavel' : 'pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (saidaError) throw saidaError

  // Insert items
  const itemsWithSaidaId = data.itens.map((item: any) => ({
    ...item,
    saida_id: saida.id,
    created_at: new Date().toISOString()
  }))

  const { error: itemsError } = await supabase
    .from('saida_itens')
    .insert(itemsWithSaidaId)

  if (itemsError) {
    await supabase.from('saidas').delete().eq('id', saida.id)
    throw itemsError
  }

  return saida
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