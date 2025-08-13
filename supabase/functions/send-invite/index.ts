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

    // For now, we'll still use Supabase's invite system but in the future
    // we could implement custom email sending using Resend
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `https://c7f9907d-3f79-439d-a9fa-b804ed28066c.lovableproject.com/auth?invite_token=${inviteData.invite_token}`,
      data: {
        nome: email.split('@')[0],
        invite_token: inviteData.invite_token,
      }
    })

    if (error) {
      console.error('Invitation error:', error)
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        throw new Error('Este email já possui uma conta cadastrada. Use um email diferente.')
      }
      throw new Error('Erro ao enviar convite: ' + error.message)
    }

    console.log('Invitation sent successfully')

    return new Response(
      JSON.stringify({ success: true, data: data }),
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