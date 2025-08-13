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
    const { email, inviterUserId, parentUserId, role, permissions } = requestBody
    
    console.log('Received request:', { email, inviterUserId, parentUserId, role, permissions })

    if (!email) {
      throw new Error('Email é obrigatório')
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

    // Save pending invite first (generates unique token automatically)
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .insert({
        email: email,
        inviter_user_id: inviterUserId,
        parent_user_id: parentUserId,
        role: role,
        permissions: permissions
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

    // Create user directly using Supabase native system
    // This will automatically send the confirmation email
    try {
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false, // User needs to confirm email
        user_metadata: {
          invite_token: inviteData.invite_token,
          role: role || 'franqueado'
        }
      })

      if (createUserError) {
        console.error('Supabase create user error:', createUserError)
        throw new Error('Erro ao criar usuário: ' + createUserError.message)
      }

      console.log('User created successfully via Supabase:', newUser)
      console.log('Confirmation email sent automatically by Supabase')
    } catch (userError) {
      console.error('User creation error:', userError)
      throw new Error('Erro ao criar usuário: ' + (userError as Error).message)
    }

    console.log('Invitation process completed')

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite_token: inviteData.invite_token,
        invite_url: inviteUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
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