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
      case 'create_inventario':
        result = await createInventario(supabaseClient, user.id, data)
        break
      case 'update_inventario':
        result = await updateInventario(supabaseClient, user.id, data)
        break
      case 'create_item':
        result = await createInventarioItem(supabaseClient, user.id, data)
        break
      case 'update_item':
        result = await updateInventarioItem(supabaseClient, user.id, data)
        break
      case 'delete_item':
        result = await deleteInventarioItem(supabaseClient, user.id, data.id)
        break
      case 'finalize_inventario':
        result = await finalizeInventario(supabaseClient, user.id, data.id)
        break
      case 'create_divergencia':
        result = await createDivergencia(supabaseClient, user.id, data)
        break
      case 'update_divergencia':
        result = await updateDivergencia(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-inventario:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createInventario(supabase: any, userId: string, data: any) {
  // Generate inventory number
  const { data: numeroResult, error: numeroError } = await supabase
    .rpc('generate_inventory_number')

  if (numeroError) throw numeroError

  const { data: inventario, error } = await supabase
    .from('inventarios')
    .insert({
      user_id: userId,
      numero_inventario: numeroResult,
      ...data,
      status: 'planejamento',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return inventario
}

async function updateInventario(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: inventario, error } = await supabase
    .from('inventarios')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return inventario
}

async function createInventarioItem(supabase: any, userId: string, data: any) {
  const { data: item, error } = await supabase
    .from('inventario_itens')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return item
}

async function updateInventarioItem(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: item, error } = await supabase
    .from('inventario_itens')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return item
}

async function deleteInventarioItem(supabase: any, userId: string, itemId: string) {
  const { error } = await supabase
    .from('inventario_itens')
    .delete()
    .eq('id', itemId)

  if (error) throw error
  return { id: itemId }
}

async function finalizeInventario(supabase: any, userId: string, inventarioId: string) {
  const { data: inventario, error } = await supabase
    .from('inventarios')
    .update({
      status: 'finalizado',
      data_finalizacao: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', inventarioId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return inventario
}

async function createDivergencia(supabase: any, userId: string, data: any) {
  const { data: divergencia, error } = await supabase
    .from('divergencias')
    .insert({
      user_id: userId,
      ...data,
      status: 'pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return divergencia
}

async function updateDivergencia(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: divergencia, error } = await supabase
    .from('divergencias')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return divergencia
}