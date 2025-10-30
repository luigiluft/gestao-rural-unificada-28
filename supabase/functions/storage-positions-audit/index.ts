import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PositionMetadata {
  id: string
  codigo: string
  ativo: boolean
  ocupado: boolean
  deposito_id: string
  created_at: string
  updated_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create client with user's auth for validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate user has access
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { depositoId } = await req.json()
    if (!depositoId) {
      throw new Error('Missing depositoId')
    }

    console.log(`[Audit] User ${user.id} requesting audit for deposito ${depositoId}`)

    // Create service role client (bypasses RLS)
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch ALL positions for this deposito (no RLS)
    const { data: allPositions, error: positionsError } = await serviceClient
      .from('storage_positions')
      .select('id, codigo, ativo, ocupado, deposito_id, created_at, updated_at')
      .eq('deposito_id', depositoId)
      .order('codigo')

    if (positionsError) {
      console.error('[Audit] Error fetching positions:', positionsError)
      throw positionsError
    }

    // Also get franquia info for this deposito
    const { data: franquiaData, error: franquiaError } = await serviceClient
      .from('franquias')
      .select('id, master_franqueado_id')
      .eq('id', depositoId)
      .single()

    if (franquiaError) {
      console.error('[Audit] Error fetching franquia:', franquiaError)
    }

    const result = {
      success: true,
      depositoId,
      franquiaId: franquiaData?.id,
      masterFranqueadoId: franquiaData?.master_franqueado_id,
      totalPositions: allPositions?.length || 0,
      positions: allPositions as PositionMetadata[],
      auditedAt: new Date().toISOString(),
      auditedBy: user.id
    }

    console.log(`[Audit] Returning ${result.totalPositions} positions for deposito ${depositoId}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Audit] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
