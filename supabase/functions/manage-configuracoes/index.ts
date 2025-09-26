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
      case 'update_config':
        result = await updateConfig(supabaseClient, user.id, data)
        break
      case 'create_tabela_frete':
        result = await createTabelaFrete(supabaseClient, user.id, data)
        break
      case 'delete_tabela_frete':
        result = await deleteTabelaFrete(supabaseClient, user.id, data.id)
        break
      case 'create_fornecedor':
        result = await createFornecedor(supabaseClient, user.id, data)
        break
      case 'update_fornecedor':
        result = await updateFornecedor(supabaseClient, user.id, data)
        break
      case 'delete_fornecedor':
        result = await deleteFornecedor(supabaseClient, user.id, data.id)
        break
      case 'create_produto':
        result = await createProduto(supabaseClient, user.id, data)
        break
      case 'update_produto':
        result = await updateProduto(supabaseClient, user.id, data)
        break
      case 'delete_produto':
        result = await deleteProduto(supabaseClient, user.id, data.id)
        break
      case 'create_suporte':
        result = await createChamadoSuporte(supabaseClient, user.id, data)
        break
      case 'update_suporte':
        result = await updateChamadoSuporte(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-configuracoes:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function updateConfig(supabase: any, userId: string, data: any) {
  const { chave, valor, descricao } = data
  
  const { data: config, error } = await supabase
    .from('configuracoes_sistema')
    .upsert({
      chave,
      valor,
      descricao,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'chave'
    })
    .select()
    .single()

  if (error) throw error
  return config
}

async function createTabelaFrete(supabase: any, userId: string, data: any) {
  const { tabelaFrete, faixas } = data

  // Create freight table
  const { data: tabela, error: tabelaError } = await supabase
    .from('tabelas_frete')
    .insert({
      franqueado_id: userId,
      ...tabelaFrete,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (tabelaError) throw tabelaError

  // Create freight ranges
  if (faixas && faixas.length > 0) {
    const faixasWithTableId = faixas.map((faixa: any) => ({
      ...faixa,
      tabela_frete_id: tabela.id,
      created_at: new Date().toISOString()
    }))

    const { error: faixasError } = await supabase
      .from('frete_faixas')
      .insert(faixasWithTableId)

    if (faixasError) {
      // Rollback table creation
      await supabase.from('tabelas_frete').delete().eq('id', tabela.id)
      throw faixasError
    }
  }

  return tabela
}

async function deleteTabelaFrete(supabase: any, userId: string, tabelaId: string) {
  const { error } = await supabase
    .from('tabelas_frete')
    .delete()
    .eq('id', tabelaId)
    .eq('franqueado_id', userId)

  if (error) throw error
  return { id: tabelaId }
}

async function createFornecedor(supabase: any, userId: string, data: any) {
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return fornecedor
}

async function updateFornecedor(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return fornecedor
}

async function deleteFornecedor(supabase: any, userId: string, fornecedorId: string) {
  const { error } = await supabase
    .from('fornecedores')
    .delete()
    .eq('id', fornecedorId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: fornecedorId }
}

async function createProduto(supabase: any, userId: string, data: any) {
  const { data: produto, error } = await supabase
    .from('produtos')
    .insert({
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return produto
}

async function updateProduto(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: produto, error } = await supabase
    .from('produtos')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return produto
}

async function deleteProduto(supabase: any, userId: string, produtoId: string) {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', produtoId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: produtoId }
}

async function createChamadoSuporte(supabase: any, userId: string, data: any) {
  const { data: chamado, error } = await supabase
    .from('chamados_suporte')
    .insert({
      user_id: userId,
      ...data,
      status: 'aberto',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return chamado
}

async function updateChamadoSuporte(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: chamado, error } = await supabase
    .from('chamados_suporte')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return chamado
}