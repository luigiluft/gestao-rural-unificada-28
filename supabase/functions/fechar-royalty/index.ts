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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can close royalties')
    }

    // Parse request
    const { royalty_id } = await req.json()

    if (!royalty_id) {
      throw new Error('royalty_id é obrigatório')
    }

    console.log('Fechando royalty:', royalty_id)

    // Get royalty details
    const { data: royalty, error: royaltyError } = await supabase
      .from('royalties')
      .select('*, contrato_franquia(*)')
      .eq('id', royalty_id)
      .single()

    if (royaltyError || !royalty) {
      throw new Error('Royalty não encontrado')
    }

    // Validate status
    if (royalty.status !== 'rascunho') {
      throw new Error('Apenas royalties em rascunho podem ser fechados')
    }

    // Close royalty
    const { data: royaltyFechado, error: fecharError } = await supabase
      .from('royalties')
      .update({
        status: 'pendente',
        data_fechamento: new Date().toISOString(),
        fechada_por: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', royalty_id)
      .select()
      .single()

    if (fecharError) throw fecharError

    console.log('Royalty fechado com sucesso')

    // Calculate next period
    const periodoFim = new Date(royalty.periodo_fim)
    const proximoPeriodoInicio = new Date(periodoFim)
    proximoPeriodoInicio.setDate(proximoPeriodoInicio.getDate() + 1)
    
    const proximoPeriodoFim = new Date(proximoPeriodoInicio)
    proximoPeriodoFim.setMonth(proximoPeriodoFim.getMonth() + 1)
    proximoPeriodoFim.setDate(0) // Last day of month

    // Calculate next due date
    const now = new Date()
    const proximoVencimento = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      royalty.contrato_franquia.dia_vencimento
    )

    // Generate next royalty number
    const { count } = await supabase
      .from('royalties')
      .select('*', { count: 'exact', head: true })
      .eq('franquia_id', royalty.franquia_id)

    const proximoNumero = `ROY-${royalty.franquia_id.substring(0, 8)}-${String((count || 0) + 1).padStart(4, '0')}`

    // Create next draft royalty
    const { data: proximoRoyalty, error: proximoError } = await supabase
      .from('royalties')
      .insert({
        numero_royalty: proximoNumero,
        contrato_franquia_id: royalty.contrato_franquia_id,
        franquia_id: royalty.franquia_id,
        periodo_inicio: proximoPeriodoInicio.toISOString().split('T')[0],
        periodo_fim: proximoPeriodoFim.toISOString().split('T')[0],
        data_emissao: now.toISOString().split('T')[0],
        data_vencimento: proximoVencimento.toISOString().split('T')[0],
        valor_base: 0,
        valor_royalties: 0,
        valor_total: 0,
        status: 'rascunho',
        gerada_automaticamente: true
      })
      .select()
      .single()

    if (proximoError) {
      console.error('Erro ao criar próximo royalty:', proximoError)
      // Don't fail the entire operation if next royalty creation fails
    } else {
      console.log('Próximo royalty criado:', proximoRoyalty.id)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Royalty fechado com sucesso',
        royalty: royaltyFechado,
        proximo_royalty: proximoRoyalty
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro ao fechar royalty:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
