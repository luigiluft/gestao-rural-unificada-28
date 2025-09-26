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

async function createEntrada(supabase: any, userId: string, data: any) {
  // Validate required fields
  if (!data.data_entrada || !data.itens || data.itens.length === 0) {
    throw new Error('Missing required fields')
  }

  // Start transaction
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (entradaError) throw entradaError

  // Insert items
  const itemsWithEntradaId = data.itens.map((item: any) => ({
    ...item,
    entrada_id: entrada.id,
    user_id: userId,
    created_at: new Date().toISOString()
  }))

  const { error: itemsError } = await supabase
    .from('entrada_itens')
    .insert(itemsWithEntradaId)

  if (itemsError) {
    // Rollback entrada
    await supabase.from('entradas').delete().eq('id', entrada.id)
    throw itemsError
  }

  return entrada
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
  const { error } = await supabase
    .from('entradas')
    .delete()
    .eq('id', entradaId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: entradaId }
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
  return entrada
}