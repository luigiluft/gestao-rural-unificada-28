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
        result = await createCTe(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateCTe(supabaseClient, user.id, data)
        break
      case 'delete':
        result = await deleteCTe(supabaseClient, user.id, data.id)
        break
      case 'get_by_saida':
        result = await getCTeBySaida(supabaseClient, data.saidaId)
        break
      case 'generate_xml':
        result = await generateXML(supabaseClient, data.id)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-ctes:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createCTe(supabase: any, userId: string, data: any) {
  console.log('📦 Creating CT-e with data:', JSON.stringify(data, null, 2))
  
  if (!data.saida_id) {
    throw new Error('saida_id é obrigatório')
  }

  const cteData = {
    ...data,
    created_by: userId,
    status: data.status || 'rascunho',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: cte, error: cteError } = await supabase
    .from('ctes')
    .insert(cteData)
    .select()
    .single()

  if (cteError) throw cteError

  return cte
}

async function updateCTe(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  // Only allow updates to draft CT-es
  const { data: existingCte, error: checkError } = await supabase
    .from('ctes')
    .select('status')
    .eq('id', id)
    .single()
  
  if (checkError) throw checkError
  
  if (existingCte.status !== 'rascunho') {
    throw new Error('Apenas CT-es em rascunho podem ser editados')
  }

  const { data: cte, error } = await supabase
    .from('ctes')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return cte
}

async function deleteCTe(supabase: any, userId: string, cteId: string) {
  // Only allow deleting draft CT-es
  const { data: existingCte, error: checkError } = await supabase
    .from('ctes')
    .select('status')
    .eq('id', cteId)
    .single()
  
  if (checkError) throw checkError
  
  if (existingCte.status !== 'rascunho') {
    throw new Error('Apenas CT-es em rascunho podem ser excluídos')
  }

  const { error } = await supabase
    .from('ctes')
    .delete()
    .eq('id', cteId)

  if (error) throw error
  return { id: cteId }
}

async function getCTeBySaida(supabase: any, saidaId: string) {
  const { data: cte, error } = await supabase
    .from('ctes')
    .select('*')
    .eq('saida_id', saidaId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error
  }

  return cte
}

async function generateXML(supabase: any, cteId: string) {
  // Get CT-e data
  const { data: cte, error: cteError } = await supabase
    .from('ctes')
    .select('*')
    .eq('id', cteId)
    .single()

  if (cteError) throw cteError

  // Generate XML structure (simplified version)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CTe xmlns="http://www.portalfiscal.inf.br/cte">
  <infCte versao="4.00" Id="CTe${cte.chave_cte || 'RASCUNHO'}">
    <ide>
      <cUF>${cte.municipio_envio_uf}</cUF>
      <CFOP>${cte.cfop}</CFOP>
      <natOp>${cte.natureza_operacao}</natOp>
      <mod>${cte.modelo}</mod>
      <serie>${cte.serie}</serie>
      <nCT>${cte.numero_cte}</nCT>
      <dhEmi>${cte.data_emissao}</dhEmi>
      <tpAmb>${cte.tipo_ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <tpCTe>${cte.tipo_cte === 'normal' ? '0' : '1'}</tpCTe>
      <modal>${cte.modal}</modal>
      <tpServ>${cte.tipo_servico}</tpServ>
    </ide>
    
    <emit>
      <CNPJ>${cte.emitente_cnpj}</CNPJ>
      <IE>${cte.emitente_ie}</IE>
      <xNome>${cte.emitente_nome}</xNome>
      <xFant>${cte.emitente_fantasia}</xFant>
    </emit>
    
    <rem>
      <CNPJ>${cte.remetente_cnpj}</CNPJ>
      <IE>${cte.remetente_ie}</IE>
      <xNome>${cte.remetente_nome}</xNome>
    </rem>
    
    <dest>
      <CNPJ>${cte.destinatario_cnpj}</CNPJ>
      <IE>${cte.destinatario_ie}</IE>
      <xNome>${cte.destinatario_nome}</xNome>
    </dest>
    
    <vPrest>
      <vTPrest>${cte.valor_total_servico}</vTPrest>
      <vRec>${cte.valor_receber}</vRec>
    </vPrest>
    
    <imp>
      <ICMS>
        <ICMS00>
          <CST>${cte.icms_situacao_tributaria}</CST>
          <vBC>${cte.icms_base_calculo}</vBC>
          <pICMS>${cte.icms_aliquota}</pICMS>
          <vICMS>${cte.icms_valor}</vICMS>
        </ICMS00>
      </ICMS>
    </imp>
  </infCte>
</CTe>`

  // Update CT-e with generated XML
  const { data: updatedCte, error: updateError } = await supabase
    .from('ctes')
    .update({
      xml_content: xml,
      updated_at: new Date().toISOString()
    })
    .eq('id', cteId)
    .select()
    .single()

  if (updateError) throw updateError

  return { xml, cte: updatedCte }
}