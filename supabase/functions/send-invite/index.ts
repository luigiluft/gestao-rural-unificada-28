import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { email, inviter_user_id, parent_user_id, role, permissions, franquia_id } = requestBody
    
    console.log('Received request:', { email, inviter_user_id, parent_user_id, role, permissions, franquia_id })

    // Validações básicas
    if (!email) {
      throw new Error('Email é obrigatório')
    }
    
    if (!inviter_user_id) {
      throw new Error('ID do usuário convidador é obrigatório')
    }
    
    if (!role) {
      throw new Error('Role é obrigatório')
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Supabase client created')

    // Verificar se o usuário convidador pode criar esse tipo de conta
    const { data: canCreate, error: validationError } = await supabaseAdmin
      .rpc('can_create_role', { 
        _creator_user_id: inviter_user_id, 
        _target_role: role 
      })

    if (validationError) {
      console.error('Validation error:', validationError)
      throw new Error('Erro ao validar permissões: ' + validationError.message)
    }

    if (!canCreate) {
      throw new Error('Você não tem permissão para criar esse tipo de conta')
    }

    // Determinar o parent_user_id correto baseado na hierarquia
    let finalParentUserId = parent_user_id || inviter_user_id

    // Para produtores, verificar/definir franquia_id
    let finalFranquiaId = franquia_id
    if (role === 'produtor') {
      // Se não foi especificada franquia e o criador é franqueado, usar a franquia dele
      if (!finalFranquiaId) {
        const { data: userFranquia, error: franquiaError } = await supabaseAdmin
          .rpc('get_user_franquia_id', { _user_id: inviter_user_id })
        
        if (franquiaError) {
          console.error('Error getting user franquia:', franquiaError)
        } else {
          finalFranquiaId = userFranquia
        }
      }
      
      if (!finalFranquiaId) {
        throw new Error('Franquia é obrigatória para criar produtor')
      }
    }

    // Save pending invite first (generates unique token automatically)
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .insert({
        email: email,
        inviter_user_id: inviter_user_id,
        parent_user_id: finalParentUserId,
        role: role,
        permissions: permissions || [],
        franquia_id: finalFranquiaId
      })
      .select('invite_token')
      .single()

    if (inviteError) {
      console.error('Pending invite error:', inviteError)
      throw new Error('Erro ao salvar convite: ' + inviteError.message)
    }

    console.log('Pending invite saved with token:', inviteData.invite_token)

    // Create invite URL
    const inviteUrl = `https://c7f9907d-3f79-439d-a9fa-b804ed28066c.lovableproject.com/auth?invite_token=${inviteData.invite_token}`
    console.log('Invite URL:', inviteUrl)

    // Generate a default password for the new user
    const defaultPassword = `Agro${Math.random().toString(36).slice(2)}!`
    console.log('Generated default password:', defaultPassword)

    // Create user directly with password and confirmed email
    try {
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true, // Email already confirmed, no confirmation needed
        user_metadata: {
          invite_token: inviteData.invite_token,
          role: role || 'franqueado',
          must_change_password: true // Flag to force password change on first login
        }
      })

      if (createUserError) {
        console.error('Supabase create user error:', createUserError)
        throw new Error('Erro ao criar usuário: ' + createUserError.message)
      }

      console.log('User created successfully:', newUser.user?.email)
      console.log('Default password set, user can login immediately')
    } catch (userError) {
      console.error('User creation error:', userError)
      throw new Error('Erro ao criar usuário: ' + (userError as Error).message)
    }

    console.log('Invitation process completed')

    return new Response(JSON.stringify({ 
      success: true, 
      invite_token: inviteData.invite_token,
      invite_url: inviteUrl,
      default_password: defaultPassword,
      message: 'Usuário criado com sucesso'
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})