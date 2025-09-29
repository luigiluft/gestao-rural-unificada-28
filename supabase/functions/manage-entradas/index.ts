import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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

    // Get user from JWT
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
        result = await createEntrada(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateEntrada(supabaseClient, user.id, data)
        break
      case 'delete':
        result = await deleteEntrada(supabaseClient, user.id, data.id)
        break
      case 'update_status':
        result = await updateEntradaStatus(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-entradas:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createEntrada(supabase: any, userId: string, data: any) {
  // Normalize input
  if (!data.data_entrada && data.dataEntrada) {
    data.data_entrada = data.dataEntrada
  }

  // Validate required fields
  if (!data.data_entrada) {
    throw new Error('Missing required fields')
  }

  // Extract itens from data to save separately and remove unsupported fields
  const { itens, tipo: _ignoredTipo, ...entradaData } = data

  // Start transaction
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert({
      user_id: userId,
      ...entradaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (entradaError) throw entradaError

  try {
    // Insert items if provided
    if (itens && itens.length > 0) {
      const itemsWithEntradaId = itens.map((item: any) => ({
        ...item,
        entrada_id: entrada.id,
        user_id: userId,
        created_at: new Date().toISOString()
      }))

      const { data: itemsData, error: itemsError } = await supabase
        .from('entrada_itens')
        .insert(itemsWithEntradaId)
        .select()

      if (itemsError) {
        // Rollback entrada
        await supabase.from('entradas').delete().eq('id', entrada.id)
        throw itemsError
      }

      return { ...entrada, itens: itemsData }
    }

    return entrada
  } catch (error) {
    // If any error occurs after entrada creation, clean up
    await supabase.from('entradas').delete().eq('id', entrada.id)
    throw error
  }
}

async function updateEntrada(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: entrada, error } = await supabase
    .from('entradas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return entrada
}

async function deleteEntrada(supabase: any, userId: string, entradaId: string) {
  const { error } = await supabase
    .from('entradas')
    .delete()
    .eq('id', entradaId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: entradaId }
}

async function updateEntradaStatus(supabase: any, userId: string, data: any) {
  const { id, status_aprovacao, observacoes_franqueado, divergencias } = data
  
  const updateData: any = {
    status_aprovacao,
    updated_at: new Date().toISOString()
  }

  if (observacoes_franqueado) {
    updateData.observacoes_franqueado = observacoes_franqueado
  }

  if (divergencias) {
    updateData.divergencias = divergencias
  }

  if (status_aprovacao === 'confirmado') {
    updateData.data_aprovacao = new Date().toISOString()
    updateData.aprovado_por = userId
  }

  const { data: entrada, error } = await supabase
    .from('entradas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Se há divergências, criar registros individuais na tabela divergencias
  if (divergencias && Array.isArray(divergencias) && divergencias.length > 0) {
    await createDivergenciasRecords(supabase, entrada, divergencias, userId)
  }

  return entrada
}

async function createDivergenciasRecords(supabase: any, entrada: any, divergencias: any[], userId: string) {
  try {
    const divergenciasRecords = []
    
    for (const div of divergencias) {
      // Encontrar o produto pelo nome do produto na divergência
      let produto_id = null
      if (div.produto_nome) {
        const { data: produto } = await supabase
          .from('produtos')
          .select('id')
          .ilike('nome', div.produto_nome)
          .limit(1)
          .single()
        
        if (produto) {
          produto_id = produto.id
        }
      }

      const divergenciaRecord = {
        user_id: entrada.user_id,
        deposito_id: entrada.deposito_id,
        entrada_id: entrada.id,
        produto_id: produto_id,
        tipo_origem: 'entrada',
        tipo_divergencia: mapTipoDivergencia(div.tipo_divergencia || div.tipo),
        quantidade_esperada: parseFloat(div.quantidade_esperada) || 0,
        quantidade_encontrada: parseFloat(div.quantidade_encontrada) || 0,
        lote: div.lote || null,
        observacoes: div.observacoes || null,
        status: 'pendente',
        prioridade: div.prioridade || 'media'
      }

      divergenciasRecords.push(divergenciaRecord)
    }

    if (divergenciasRecords.length > 0) {
      const { error: divError } = await supabase
        .from('divergencias')
        .insert(divergenciasRecords)

      if (divError) {
        console.error('Error creating divergencias records:', divError)
        // Não falha a operação principal, apenas loga o erro
      } else {
        console.log(`Created ${divergenciasRecords.length} divergencias records for entrada ${entrada.id}`)
      }
    }
  } catch (error) {
    console.error('Error in createDivergenciasRecords:', error)
    // Não falha a operação principal, apenas loga o erro
  }
}

// Função para mapear tipos de divergência para valores válidos
function mapTipoDivergencia(tipo: string): string {
  const tipoLower = (tipo || '').toLowerCase()
  
  if (tipoLower.includes('faltante') || tipoLower.includes('falta')) {
    return 'produto_faltante'
  }
  if (tipoLower.includes('excedente') || tipoLower.includes('sobra')) {
    return 'produto_excedente'
  }
  if (tipoLower.includes('quantidade')) {
    return 'quantidade_incorreta'
  }
  if (tipoLower.includes('lote')) {
    return 'lote_incorreto'
  }
  if (tipoLower.includes('validade')) {
    return 'validade_incorreta'
  }
  
  // Default para quantidade incorreta
  return 'quantidade_incorreta'
}