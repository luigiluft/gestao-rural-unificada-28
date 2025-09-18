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
    const { email, inviter_user_id, parent_user_id, role, permissions, franquia_id, resend } = requestBody
    
    console.log('Received request:', { email, inviter_user_id, parent_user_id, role, permissions, franquia_id, resend })

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

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido')
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

    // Verificar se service role key está configurada
    if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Service role key não configurada')
    }

    // Se é reenvio, não verificar se usuário já existe
    if (!resend) {
      // Verificar se usuário já existe
      const { data: existingUser, error: checkUserError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (checkUserError) {
        console.error('Erro ao verificar usuários existentes:', checkUserError)
        throw new Error('Erro ao verificar se usuário já existe')
      }

      const userExists = existingUser.users.some(user => user.email === email)
      if (userExists) {
        throw new Error('Um usuário com este email já existe no sistema')
      }

      // Verificar se já existe convite pendente para este email
      const { data: existingInvite, error: inviteCheckError } = await supabaseAdmin
        .from('pending_invites')
        .select('id')
        .eq('email', email)
        .is('used_at', null)
        .maybeSingle()

      if (inviteCheckError) {
        console.error('Erro ao verificar convites pendentes:', inviteCheckError)
        throw new Error('Erro ao verificar convites pendentes')
      }

      if (existingInvite) {
        throw new Error('Já existe um convite pendente para este email')
      }
    }

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

    let inviteData: any = null
    let shouldCreateUser = true

    // Se é reenvio, buscar convite existente
    if (resend) {
      const { data: existingInvite, error: existingInviteError } = await supabaseAdmin
        .from('pending_invites')
        .select('invite_token, id')
        .eq('email', email)
        .is('used_at', null)
        .single()

      if (existingInviteError || !existingInvite) {
        throw new Error('Convite não encontrado para reenvio')
      }

      inviteData = existingInvite
      console.log('Reusing existing invite token:', inviteData.invite_token)
      
      // Verificar se usuário já foi criado para este convite
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUser.users.some(user => 
        user.email === email && user.user_metadata?.invite_token === inviteData.invite_token
      )
      
      if (userExists) {
        shouldCreateUser = false
        console.log('User already exists for this invite, skipping user creation')
      }
    } else {
      // Save pending invite first (generates unique token automatically)
      const { data: newInviteData, error: inviteError } = await supabaseAdmin
        .from('pending_invites')
        .insert({
          email: email,
          inviter_user_id: inviter_user_id,
          parent_user_id: finalParentUserId,
          role: role,
          permissions: permissions || [],
          franquia_id: finalFranquiaId
        })
        .select('invite_token, id')
        .single()

      if (inviteError) {
        console.error('Pending invite error:', inviteError)
        throw new Error('Erro ao salvar convite: ' + inviteError.message)
      }

      inviteData = newInviteData
      console.log('Pending invite saved with token:', inviteData.invite_token)
    }

    // Create invite URL
    const inviteUrl = `https://c7f9907d-3f79-439d-a9fa-b804ed28066c.lovableproject.com/auth?invite_token=${inviteData.invite_token}`
    console.log('Invite URL:', inviteUrl)

    let defaultPassword = null

    // Create user only if needed
    if (shouldCreateUser) {
      // Generate a default password for the new user
      defaultPassword = `Agro${Math.random().toString(36).slice(2)}!`
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
          
          // Rollback: delete the pending invite if user creation failed
          if (!resend) {
            console.log('Rolling back pending invite due to user creation error')
            await supabaseAdmin
              .from('pending_invites')
              .delete()
              .eq('id', inviteData.id)
          }
          
          // Provide more specific error messages
          if (createUserError.message.includes('User already registered')) {
            throw new Error('Este email já está registrado no sistema')
          } else if (createUserError.message.includes('password')) {
            throw new Error('Erro na definição da senha do usuário')
          } else if (createUserError.message.includes('email')) {
            throw new Error('Erro com o email fornecido')
          } else {
            throw new Error('Erro ao criar usuário: ' + createUserError.message)
          }
        }

        console.log('User created successfully:', newUser.user?.email)
        console.log('Default password set, user can login immediately')
      } catch (userError) {
        console.error('User creation error:', userError)
        
        // Rollback: delete the pending invite if user creation failed
        if (!resend) {
          console.log('Rolling back pending invite due to user creation error')
          try {
            await supabaseAdmin
              .from('pending_invites')
              .delete()
              .eq('id', inviteData.id)
          } catch (rollbackError) {
            console.error('Failed to rollback pending invite:', rollbackError)
          }
        }
        
        throw new Error('Erro ao criar usuário: ' + (userError as Error).message)
      }
    } else {
      console.log('Skipping user creation - user already exists')
    }

    console.log('Invitation process completed')

    const responseMessage = resend 
      ? 'Convite reenviado com sucesso' 
      : shouldCreateUser 
        ? 'Usuário criado com sucesso' 
        : 'Convite processado com sucesso'

    return new Response(JSON.stringify({ 
      success: true, 
      invite_token: inviteData.invite_token,
      invite_url: inviteUrl,
      default_password: defaultPassword,
      message: responseMessage,
      user_created: shouldCreateUser
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error('Function error:', error)
    
    // Determine appropriate HTTP status code based on error type
    let statusCode = 400
    if (error.message.includes('já existe') || error.message.includes('already')) {
      statusCode = 409 // Conflict
    } else if (error.message.includes('não tem permissão') || error.message.includes('não configurada')) {
      statusCode = 403 // Forbidden
    } else if (error.message.includes('não encontrado')) {
      statusCode = 404 // Not found
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})