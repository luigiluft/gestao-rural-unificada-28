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
      case 'create':
        result = await createViagem(supabaseClient, user.id, data)
        break
      case 'create_with_remessas':
        result = await createViagemWithRemessas(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateViagem(supabaseClient, user.id, data)
        break
      case 'update_data':
        result = await updateViagemData(supabaseClient, user.id, data)
        break
      case 'confirm':
        result = await confirmViagem(supabaseClient, user.id, data.id)
        break
      case 'delete':
        result = await deleteViagem(supabaseClient, user.id, data.id)
        break
      case 'create_veiculo':
        result = await createVeiculo(supabaseClient, user.id, data)
        break
      case 'update_veiculo':
        result = await updateVeiculo(supabaseClient, user.id, data)
        break
      case 'delete_veiculo':
        result = await deleteVeiculo(supabaseClient, user.id, data.id)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-viagens:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createViagem(supabase: any, userId: string, data: any) {
  // Get user's franquia
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: franquia } = await supabase
    .from('franquias')
    .select('*')
    .eq('master_franqueado_id', userId)
    .single()

  const { data: viagem, error } = await supabase
    .from('viagens')
    .insert({
      user_id: userId,
      franquia_id: franquia?.id,
      ...data,
      status: 'planejamento',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return viagem
}

async function createViagemWithRemessas(supabase: any, userId: string, data: any) {
  const { viagemData, remessasIds } = data

  // Get user's franquia and profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: franquia } = await supabase
    .from('franquias')
    .select('*')
    .eq('master_franqueado_id', userId)
    .single()

  // Get remessas details
  const { data: remessas } = await supabase
    .from('saidas')
    .select('*, saida_itens(*)')
    .in('id', remessasIds)

  if (!remessas || remessas.length === 0) {
    throw new Error('No valid remessas found')
  }

  // Calculate totals
  const totalRemessas = remessas.length
  const pesoTotal = remessas.reduce((sum: number, r: any) => sum + (r.peso_total || 0), 0)

  // Create viagem with complete data
  const viagemCompleta = {
    ...viagemData,
    user_id: userId,
    franquia_id: franquia?.id,
    total_remessas: totalRemessas,
    peso_total: pesoTotal,
    status: 'planejamento',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: viagem, error: viagemError } = await supabase
    .from('viagens')
    .insert(viagemCompleta)
    .select()
    .single()

  if (viagemError) throw viagemError

  // Update saidas to link to viagem
  const { error: saidasError } = await supabase
    .from('saidas')
    .update({ 
      viagem_id: viagem.id,
      status: 'alocado_viagem'
    })
    .in('id', remessasIds)

  if (saidasError) {
    // Rollback viagem creation
    await supabase.from('viagens').delete().eq('id', viagem.id)
    throw saidasError
  }

  return viagem
}

async function updateViagem(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: viagem, error } = await supabase
    .from('viagens')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return viagem
}

async function updateViagemData(supabase: any, userId: string, data: any) {
  const { viagemId, data_inicio, data_fim } = data
  
  const updateData: any = {}
  if (data_inicio) updateData.data_inicio = data_inicio
  if (data_fim) updateData.data_fim = data_fim

  const { data: viagem, error } = await supabase
    .from('viagens')
    .update(updateData)
    .eq('id', viagemId)
    .select()
    .single()

  if (error) throw error
  return viagem
}

async function confirmViagem(supabase: any, userId: string, viagemId: string) {
  const { data: viagem, error } = await supabase
    .from('viagens')
    .update({
      status: 'confirmada',
      data_confirmacao: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', viagemId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return viagem
}

async function deleteViagem(supabase: any, userId: string, viagemId: string) {
  const { error } = await supabase
    .from('viagens')
    .delete()
    .eq('id', viagemId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: viagemId }
}

async function createVeiculo(supabase: any, userId: string, data: any) {
  const { data: veiculo, error } = await supabase
    .from('veiculos')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return veiculo
}

async function updateVeiculo(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: veiculo, error } = await supabase
    .from('veiculos')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return veiculo
}

async function deleteVeiculo(supabase: any, userId: string, veiculoId: string) {
  const { error } = await supabase
    .from('veiculos')
    .delete()
    .eq('id', veiculoId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: veiculoId }
}