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
      case 'create_comprovante':
        result = await createComprovante(supabaseClient, user.id, data)
        break
      case 'update_comprovante':
        result = await updateComprovante(supabaseClient, user.id, data)
        break
      case 'upload_photo':
        result = await uploadPhoto(supabaseClient, user.id, data)
        break
      case 'assign_driver':
        result = await assignDriver(supabaseClient, user.id, data)
        break
      case 'update_assignment':
        result = await updateAssignment(supabaseClient, user.id, data)
        break
      case 'invite_driver':
        result = await inviteDriver(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-comprovantes:', error)
    
    // Structured error response
    const errorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'UNKNOWN_ERROR',
        details: (error as any)?.details || null
      }
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createComprovante(supabase: any, userId: string, data: any) {
  // Sanitize status: map common values to valid enum values
  const statusMap: Record<string, string> = {
    'confirmado': 'entregue',
    'confirmed': 'entregue',
    'completed': 'entregue'
  }
  
  let status = data.status || 'pendente'
  status = statusMap[status] || status
  
  // Ensure status is valid enum value
  const validStatus = ['pendente', 'em_andamento', 'entregue', 'cancelado']
  if (!validStatus.includes(status)) {
    console.warn(`Invalid status "${data.status}" mapped to "pendente"`)
    status = 'pendente'
  }
  
  console.log(`Creating comprovante with status: ${status}`)
  
  const { data: comprovante, error } = await supabase
    .from('comprovantes_entrega')
    .insert({
      user_id: userId,
      ...data,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating comprovante:', error)
    throw error
  }
  
  console.log(`Comprovante created successfully: ${comprovante.id}`)
  return comprovante
}

async function updateComprovante(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  // Sanitize status if present
  if (updateData.status) {
    const statusMap: Record<string, string> = {
      'confirmado': 'entregue',
      'confirmed': 'entregue',
      'completed': 'entregue'
    }
    
    let status = statusMap[updateData.status] || updateData.status
    const validStatus = ['pendente', 'em_andamento', 'entregue', 'cancelado']
    
    if (!validStatus.includes(status)) {
      console.warn(`Invalid status "${updateData.status}" - keeping current value`)
      delete updateData.status
    } else {
      updateData.status = status
    }
  }
  
  console.log(`Updating comprovante ${id} with:`, updateData)
  
  const { data: comprovante, error } = await supabase
    .from('comprovantes_entrega')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating comprovante:', error)
    throw error
  }
  
  console.log(`Comprovante updated successfully: ${id}`)
  return comprovante
}

async function uploadPhoto(supabase: any, userId: string, data: any) {
  const { comprovante_id, url_foto, tipo, descricao, latitude, longitude, data_foto } = data
  
  console.log(`Uploading photo for comprovante ${comprovante_id}`)
  
  const { data: foto, error } = await supabase
    .from('comprovante_fotos')
    .insert({
      comprovante_id,
      url_foto,
      tipo,
      descricao,
      latitude,
      longitude,
      data_foto: data_foto || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting photo:', error)
    throw error
  }

  console.log(`Photo inserted successfully: ${foto.id}`)

  // Use atomic RPC function to increment total_fotos
  const { data: newTotal, error: rpcError } = await supabase
    .rpc('increment_total_fotos', { p_comprovante_id: comprovante_id })

  if (rpcError) {
    console.error('Error incrementing photos count:', rpcError)
  } else {
    console.log(`Photos count incremented to: ${newTotal}`)
  }

  return foto
}

async function assignDriver(supabase: any, userId: string, data: any) {
  const { comprovante_id, motorista_id } = data
  
  const { data: assignment, error } = await supabase
    .from('delivery_assignments')
    .insert({
      comprovante_id,
      motorista_id,
      assigned_by: userId,
      status: 'atribuido',
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return assignment
}

async function updateAssignment(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: assignment, error } = await supabase
    .from('delivery_assignments')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return assignment
}

async function inviteDriver(supabase: any, userId: string, data: any) {
  const { email, nome, cpf, telefone } = data
  
  // Generate invite link with CPF for driver registration
  const inviteData = {
    email,
    nome,
    cpf,
    telefone,
    invited_by: userId,
    invite_type: 'motorista',
    created_at: new Date().toISOString()
  }

  // Call send-invite function
  const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('send-invite', {
    body: {
      email,
      inviteToken: crypto.randomUUID(),
      senderName: 'Sistema de Entregas',
      driverData: inviteData
    }
  })

  if (inviteError) {
    console.error('Error sending driver invite:', inviteError)
    throw new Error('Falha ao enviar convite para motorista')
  }

  return inviteResult
}