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
      case 'create_profile':
        result = await createProfile(supabaseClient, user.id, data)
        break
      case 'update_profile':
        result = await updateProfile(supabaseClient, user.id, data)
        break
      case 'invite_user':
        result = await inviteUser(supabaseClient, user.id, data)
        break
      case 'create_motorista':
        result = await createMotorista(supabaseClient, user.id, data)
        break
      case 'update_motorista':
        result = await updateMotorista(supabaseClient, user.id, data)
        break
      case 'delete_motorista':
        result = await deleteMotorista(supabaseClient, user.id, data.id)
        break
      case 'link_motorista':
        result = await linkMotorista(supabaseClient, data)
        break
      case 'create_franquia':
        result = await createFranquia(supabaseClient, user.id, data)
        break
      case 'update_franquia':
        result = await updateFranquia(supabaseClient, user.id, data)
        break
      case 'create_fazenda':
        result = await createFazenda(supabaseClient, user.id, data)
        break
      case 'update_fazenda':
        result = await updateFazenda(supabaseClient, user.id, data)
        break
      case 'delete_fazenda':
        result = await deleteFazenda(supabaseClient, user.id, data.id)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-usuarios:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createProfile(supabase: any, userId: string, data: any) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return profile
}

async function updateProfile(supabase: any, userId: string, data: any) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return profile
}

async function inviteUser(supabase: any, userId: string, data: any) {
  const { email, role, permissions, franquia_id } = data
  
  // Generate invite token
  const inviteToken = crypto.randomUUID()
  
  const { data: invite, error } = await supabase
    .from('pending_invites')
    .insert({
      email,
      role,
      permissions,
      franquia_id,
      parent_user_id: userId,
      invite_token: inviteToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Call send-invite function
  const inviteResponse = await supabase.functions.invoke('send-invite', {
    body: {
      email,
      inviteToken,
      senderName: data.senderName || 'Sistema'
    }
  })

  if (inviteResponse.error) {
    console.error('Error sending invite email:', inviteResponse.error)
  }

  return invite
}

async function createMotorista(supabase: any, userId: string, data: any) {
  const { data: motorista, error } = await supabase
    .from('motoristas')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return motorista
}

async function updateMotorista(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: motorista, error } = await supabase
    .from('motoristas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return motorista
}

async function deleteMotorista(supabase: any, userId: string, motoristaId: string) {
  const { error } = await supabase
    .from('motoristas')
    .delete()
    .eq('id', motoristaId)

  if (error) throw error
  return { id: motoristaId }
}

async function linkMotorista(supabase: any, data: any) {
  const { cpf, authUserId } = data
  
  const { data: result, error } = await supabase
    .rpc('link_motorista_to_auth_user', {
      p_cpf: cpf,
      p_auth_user_id: authUserId
    })

  if (error) throw error
  return result
}

async function createFranquia(supabase: any, userId: string, data: any) {
  const { data: franquia, error } = await supabase
    .from('franquias')
    .insert({
      master_franqueado_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return franquia
}

async function updateFranquia(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: franquia, error } = await supabase
    .from('franquias')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('master_franqueado_id', userId)
    .select()
    .single()

  if (error) throw error
  return franquia
}

async function createFazenda(supabase: any, userId: string, data: any) {
  const { data: fazenda, error } = await supabase
    .from('fazendas')
    .insert({
      produtor_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return fazenda
}

async function updateFazenda(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: fazenda, error } = await supabase
    .from('fazendas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('produtor_id', userId)
    .select()
    .single()

  if (error) throw error
  return fazenda
}

async function deleteFazenda(supabase: any, userId: string, fazendaId: string) {
  const { error } = await supabase
    .from('fazendas')
    .delete()
    .eq('id', fazendaId)
    .eq('produtor_id', userId)

  if (error) throw error
  return { id: fazendaId }
}