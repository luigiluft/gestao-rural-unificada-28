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
    const { email, inviterUserId, parentUserId, role, permissions } = await req.json()

    // Create Supabase client with service role key for admin operations
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

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userCheckError && !userCheckError.message.includes('User not found')) {
      console.error('Error checking user:', userCheckError)
      throw userCheckError
    }

    if (existingUser && existingUser.user) {
      console.log('User already exists:', email)
      throw new Error('Este email já possui uma conta cadastrada. Use um email diferente.')
    }

    // Save pending invite
    const { error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .insert({
        email: email,
        inviter_user_id: inviterUserId,
        parent_user_id: parentUserId,
        role: role,
        permissions: permissions
      })

    if (inviteError) {
      throw inviteError
    }

    // Use admin API to invite user by email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `https://c7f9907d-3f79-439d-a9fa-b804ed28066c.lovableproject.com/completar-cadastro`,
      data: {
        nome: email.split('@')[0],
      }
    })

    if (error) {
      console.error('Invite error:', error)
      if (error.message.includes('already been registered')) {
        throw new Error('Este email já possui uma conta cadastrada. Use um email diferente.')
      }
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})