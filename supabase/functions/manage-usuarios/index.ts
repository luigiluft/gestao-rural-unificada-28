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
      case 'list_profiles':
        result = await listProfiles(supabaseClient, user.id)
        break
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
      case 'update_role':
        result = await updateRole(supabaseClient, user.id, data)
        break
      case 'get_children':
        result = await getChildren(supabaseClient, data.parent_user_id)
        break
      case 'link_child':
        result = await linkChild(supabaseClient, data)
        break
      case 'unlink_child':
        result = await unlinkChild(supabaseClient, data)
        break
      case 'get_permissions':
        result = await getPermissions(supabaseClient, data.user_id)
        break
      case 'update_permissions':
        result = await updatePermissions(supabaseClient, data)
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

async function listProfiles(supabase: any, userId: string) {
  // Verificar se o usuário é admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can list all profiles')
  }

  // Buscar todos os perfis
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, nome, email, role')
    .order('nome')

  if (error) throw error
  return profiles
}

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

async function updateRole(supabase: any, adminUserId: string, data: any) {
  // Verificar se o usuário que está fazendo a mudança é admin
  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', adminUserId)
    .single()

  if (adminError || adminProfile?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can update roles')
  }

  const { user_id, role } = data

  // Primeiro, remover todas as roles existentes do usuário
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', user_id)

  if (deleteError) throw deleteError

  // Inserir a nova role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id,
      role,
    })

  if (insertError) throw insertError

  return { user_id, role }
}

async function getChildren(supabase: any, parentUserId: string) {
  const { data, error } = await supabase
    .from('user_hierarchy')
    .select('child_user_id')
    .eq('parent_user_id', parentUserId)
    .eq('ativo', true)

  if (error) throw error
  return data
}

async function linkChild(supabase: any, data: any) {
  const { parent_user_id, child_user_id } = data

  const { data: hierarchy, error } = await supabase
    .from('user_hierarchy')
    .insert({
      parent_user_id,
      child_user_id,
      ativo: true,
    })
    .select()
    .single()

  if (error) throw error
  return hierarchy
}

async function unlinkChild(supabase: any, data: any) {
  const { parent_user_id, child_user_id } = data

  const { error } = await supabase
    .from('user_hierarchy')
    .update({ ativo: false })
    .eq('parent_user_id', parent_user_id)
    .eq('child_user_id', child_user_id)

  if (error) throw error
  return { parent_user_id, child_user_id }
}

async function getPermissions(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_permission_templates')
    .select('permission')
    .eq('user_id', userId)
    .eq('ativo', true)

  if (error) throw error
  return data
}

async function updatePermissions(supabase: any, data: any) {
  const { user_id, permissions } = data

  // Desativar todas as permissões existentes
  const { error: deactivateError } = await supabase
    .from('user_permission_templates')
    .update({ ativo: false })
    .eq('user_id', user_id)

  if (deactivateError) throw deactivateError

  // Inserir as novas permissões
  if (permissions.length > 0) {
    const newPermissions = permissions.map((permission: string) => ({
      user_id,
      permission,
      ativo: true,
    }))

    const { error: insertError } = await supabase
      .from('user_permission_templates')
      .insert(newPermissions)

    if (insertError) throw insertError
  }

  return { user_id, permissions }
}