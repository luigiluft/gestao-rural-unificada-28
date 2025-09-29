import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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
      case 'create_movement':
        result = await createMovement(supabaseClient, user.id, data)
        break
      case 'create_position':
        result = await createStoragePosition(supabaseClient, user.id, data)
        break
      case 'update_position':
        result = await updateStoragePosition(supabaseClient, user.id, data)
        break
      case 'bulk_create_positions':
        result = await bulkCreatePositions(supabaseClient, user.id, data)
        break
      case 'allocate_pallet':
        result = await allocatePallet(supabaseClient, user.id, data)
        break
      case 'create_reservation':
        result = await createReservation(supabaseClient, user.id, data)
        break
      case 'delete_reservation':
        result = await deleteReservation(supabaseClient, user.id, data.id)
        break
      case 'refresh_estoque':
        result = await refreshEstoque(supabaseClient)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-estoque:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createMovement(supabase: any, userId: string, data: any) {
  const { data: movement, error } = await supabase
    .from('movimentacoes')
    .insert({
      user_id: userId,
      ...data,
      data_movimentacao: data.data_movimentacao || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return movement
}

async function createStoragePosition(supabase: any, userId: string, data: any) {
  const { data: position, error } = await supabase
    .from('storage_positions')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return position
}

async function updateStoragePosition(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: position, error } = await supabase
    .from('storage_positions')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return position
}

async function bulkCreatePositions(supabase: any, userId: string, data: any) {
  const { positions } = data
  
  const positionsWithTimestamps = positions.map((pos: any) => ({
    ...pos,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  const { data: createdPositions, error } = await supabase
    .from('storage_positions')
    .upsert(positionsWithTimestamps, {
      onConflict: 'deposito_id,codigo',
      ignoreDuplicates: false
    })
    .select()

  if (error) throw error
  return createdPositions
}

async function allocatePallet(supabase: any, userId: string, data: any) {
  const { palletId, posicaoId, barcodeProtudo, barcodePosicao } = data
  
  // Call the database function for pallet allocation
  const { data: result, error } = await supabase
    .rpc('complete_allocation_and_create_stock', {
      p_wave_item_id: palletId,
      p_posicao_id: posicaoId,
      p_barcode_produto: barcodeProtudo,
      p_barcode_posicao: barcodePosicao
    })

  if (error) throw error
  return result
}

async function createReservation(supabase: any, userId: string, data: any) {
  const { data: reservation, error } = await supabase
    .from('estoque_reservas')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return reservation
}

async function deleteReservation(supabase: any, userId: string, reservationId: string) {
  const { error } = await supabase
    .from('estoque_reservas')
    .delete()
    .eq('id', reservationId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: reservationId }
}

async function refreshEstoque(supabase: any) {
  // Call the RPC function to refresh stock calculations
  const { data: result, error } = await supabase
    .rpc('refresh_estoque_with_retry')

  if (error) throw error
  return result
}