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

    // Parse request
    const { franquia_id, contrato_franquia_id } = await req.json()

    console.log('Gerando royalty para franquia:', franquia_id)

    // Get active contract
    let contratoQuery = supabase
      .from('contrato_franquia')
      .select('*')
      .eq('status', 'ativo')
      .single()

    if (contrato_franquia_id) {
      contratoQuery = contratoQuery.eq('id', contrato_franquia_id)
    } else if (franquia_id) {
      contratoQuery = contratoQuery.eq('franquia_id', franquia_id)
    } else {
      throw new Error('franquia_id ou contrato_franquia_id é obrigatório')
    }

    const { data: contrato, error: contratoError } = await contratoQuery

    if (contratoError || !contrato) {
      console.log('Nenhum contrato ativo encontrado')
      return new Response(
        JSON.stringify({ message: 'Nenhum contrato ativo encontrado para esta franquia' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Calculate period (current month)
    const now = new Date()
    const periodoInicio = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodoFim = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get invoices in period (including drafts for estimation)
    const { data: faturas, error: faturasError } = await supabase
      .from('faturas')
      .select(`
        id,
        valor_total,
        valor_servicos,
        contrato_id,
        contratos_servico!inner(franquia_id)
      `)
      .eq('contratos_servico.franquia_id', contrato.franquia_id)
      .in('status', ['rascunho', 'pendente', 'pago'])
      .gte('data_emissao', periodoInicio.toISOString().split('T')[0])
      .lte('data_emissao', periodoFim.toISOString().split('T')[0])

    if (faturasError) {
      throw faturasError
    }

    console.log('Faturas encontradas:', faturas?.length || 0)

    // Calculate total invoiced
    const valorBase = faturas?.reduce((sum, f) => sum + (parseFloat(f.valor_servicos) || 0), 0) || 0

    // Calculate royalties based on type
    let valorRoyalties = 0
    const itensRoyalty: any[] = []

    if (contrato.tipo_royalty === 'percentual_faturamento') {
      const percentual = parseFloat(contrato.percentual_faturamento || '0')
      valorRoyalties = (valorBase * percentual) / 100

      itensRoyalty.push({
        tipo_servico: 'percentual_faturamento',
        descricao: `${percentual}% do faturamento`,
        quantidade: 1,
        valor_faturado: valorBase,
        percentual_royalty: percentual,
        valor_royalty: valorRoyalties,
        detalhes_calculo: {
          total_faturado: valorBase,
          percentual_aplicado: percentual,
          numero_faturas: faturas?.length || 0
        }
      })
    } else if (contrato.tipo_royalty === 'valor_fixo_mensal') {
      valorRoyalties = parseFloat(contrato.valor_fixo_mensal || '0')

      itensRoyalty.push({
        tipo_servico: 'valor_fixo_mensal',
        descricao: 'Taxa mensal fixa',
        quantidade: 1,
        valor_faturado: valorBase,
        valor_royalty: valorRoyalties,
        detalhes_calculo: {
          total_faturado: valorBase,
          valor_fixo: valorRoyalties
        }
      })
    } else if (contrato.tipo_royalty === 'margem_por_servico') {
      const margens = contrato.margens_servico || {}

      // Get service details from invoices
      const { data: itensServicos, error: itensError } = await supabase
        .from('fatura_itens')
        .select('tipo_servico, quantidade, valor_total')
        .in('fatura_id', faturas?.map(f => f.id) || [])

      if (!itensError && itensServicos) {
        // Group by service type
        const servicosAgrupados: Record<string, { quantidade: number; valor: number }> = {}
        
        itensServicos.forEach(item => {
          if (!servicosAgrupados[item.tipo_servico]) {
            servicosAgrupados[item.tipo_servico] = { quantidade: 0, valor: 0 }
          }
          servicosAgrupados[item.tipo_servico].quantidade += parseFloat(item.quantidade || '0')
          servicosAgrupados[item.tipo_servico].valor += parseFloat(item.valor_total || '0')
        })

        // Calculate royalty for each service
        for (const [tipoServico, dados] of Object.entries(servicosAgrupados)) {
          const margemUnitaria = parseFloat(margens[tipoServico] || '0')
          const valorRoyaltyItem = dados.quantidade * margemUnitaria

          if (valorRoyaltyItem > 0) {
            valorRoyalties += valorRoyaltyItem

            itensRoyalty.push({
              tipo_servico: tipoServico,
              descricao: `Margem por ${tipoServico}`,
              quantidade: dados.quantidade,
              valor_faturado: dados.valor,
              margem_unitaria: margemUnitaria,
              valor_royalty: valorRoyaltyItem,
              detalhes_calculo: {
                quantidade_servicos: dados.quantidade,
                margem_unitaria: margemUnitaria,
                valor_faturado: dados.valor
              }
            })
          }
        }
      }
    }

    if (valorRoyalties === 0) {
      console.log('Nenhum royalty calculado para o período')
      return new Response(
        JSON.stringify({ message: 'Nenhum royalty para calcular no período' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Calculate due date
    const dataVencimento = new Date(now.getFullYear(), now.getMonth(), contrato.dia_vencimento)
    if (dataVencimento < now) {
      dataVencimento.setMonth(dataVencimento.getMonth() + 1)
    }

    // Check if draft royalty already exists
    const { data: royaltyExistente, error: royaltyExistenteError } = await supabase
      .from('royalties')
      .select('id')
      .eq('contrato_franquia_id', contrato.id)
      .eq('status', 'rascunho')
      .gte('periodo_inicio', periodoInicio.toISOString().split('T')[0])
      .lte('periodo_fim', periodoFim.toISOString().split('T')[0])
      .maybeSingle()

    const valorTotal = valorRoyalties

    if (royaltyExistente) {
      // Update existing draft
      const { error: updateError } = await supabase
        .from('royalties')
        .update({
          valor_base: valorBase,
          valor_royalties: valorRoyalties,
          valor_total: valorTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', royaltyExistente.id)

      if (updateError) throw updateError

      // Delete old items and insert new ones
      await supabase.from('royalty_itens').delete().eq('royalty_id', royaltyExistente.id)

      if (itensRoyalty.length > 0) {
        const { error: itensError } = await supabase
          .from('royalty_itens')
          .insert(itensRoyalty.map(item => ({ ...item, royalty_id: royaltyExistente.id })))

        if (itensError) throw itensError
      }

      return new Response(
        JSON.stringify({ 
          message: 'Royalty atualizado com sucesso',
          royalty_id: royaltyExistente.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate royalty number
    const { count } = await supabase
      .from('royalties')
      .select('*', { count: 'exact', head: true })
      .eq('franquia_id', contrato.franquia_id)

    const numeroRoyalty = `ROY-${contrato.franquia_id.substring(0, 8)}-${String((count || 0) + 1).padStart(4, '0')}`

    // Create new royalty
    const { data: novoRoyalty, error: royaltyError } = await supabase
      .from('royalties')
      .insert({
        numero_royalty: numeroRoyalty,
        contrato_franquia_id: contrato.id,
        franquia_id: contrato.franquia_id,
        periodo_inicio: periodoInicio.toISOString().split('T')[0],
        periodo_fim: periodoFim.toISOString().split('T')[0],
        data_emissao: now.toISOString().split('T')[0],
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        valor_base: valorBase,
        valor_royalties: valorRoyalties,
        valor_total: valorTotal,
        status: 'rascunho',
        gerada_automaticamente: false
      })
      .select()
      .single()

    if (royaltyError) throw royaltyError

    // Insert items
    if (itensRoyalty.length > 0) {
      const { error: itensError } = await supabase
        .from('royalty_itens')
        .insert(itensRoyalty.map(item => ({ ...item, royalty_id: novoRoyalty.id })))

      if (itensError) throw itensError
    }

    console.log('Royalty gerado com sucesso:', novoRoyalty.id)

    return new Response(
      JSON.stringify({ 
        message: 'Royalty gerado com sucesso',
        royalty: novoRoyalty
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro ao gerar royalty:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
