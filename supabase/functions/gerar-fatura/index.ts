import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contrato_id } = await req.json()

    if (!contrato_id) {
      throw new Error('contrato_id é obrigatório')
    }

    console.log('Gerando fatura para contrato:', contrato_id)

    // Buscar dados do contrato
    const { data: contrato, error: contratoError } = await supabase
      .from('contratos_servico')
      .select(`
        *,
        franquias:franquia_id (id, nome),
        produtor:profiles!produtor_id (user_id, nome)
      `)
      .eq('id', contrato_id)
      .single()

    if (contratoError) throw contratoError
    if (!contrato) throw new Error('Contrato não encontrado')

    console.log('Contrato encontrado:', contrato.numero_contrato)

    // Calcular período de faturamento (sempre do início do mês até hoje para rascunhos)
    const hoje = new Date()
    const periodoInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const periodoFim = hoje

    console.log('Período:', periodoInicio.toISOString(), 'até', periodoFim.toISOString())

    // Verificar se já existe fatura em rascunho para este contrato
    const { data: faturaRascunho } = await supabase
      .from('faturas')
      .select('id, numero_fatura')
      .eq('contrato_id', contrato_id)
      .eq('status', 'rascunho')
      .maybeSingle()

    // Se existe rascunho, deletar os itens antigos para recalcular
    if (faturaRascunho) {
      console.log('Atualizando fatura em rascunho:', faturaRascunho.numero_fatura)
      
      const { error: deleteItensError } = await supabase
        .from('fatura_itens')
        .delete()
        .eq('fatura_id', faturaRascunho.id)
      
      if (deleteItensError) {
        console.error('Erro ao deletar itens antigos:', deleteItensError)
      }
    }

    // Chamar função SQL para calcular serviços do período
    const { data: servicosCalculados, error: calcError } = await supabase
      .rpc('calcular_servicos_periodo', {
        p_contrato_id: contrato_id,
        p_data_inicio: periodoInicio.toISOString(),
        p_data_fim: periodoFim.toISOString()
      })

    if (calcError) {
      console.error('Erro ao calcular serviços:', calcError)
      throw calcError
    }

    console.log('Serviços calculados:', servicosCalculados)

    if (!servicosCalculados || servicosCalculados.length === 0) {
      console.log('Nenhum serviço utilizado no período')
      
      // Se já existe fatura em rascunho sem itens, manter com valor zerado
      if (faturaRascunho) {
        await supabase
          .from('faturas')
          .update({
            periodo_fim: periodoFim.toISOString().split('T')[0],
            valor_servicos: 0,
            valor_total: 0,
          })
          .eq('id', faturaRascunho.id)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Nenhum serviço utilizado no período. Fatura mantida zerada.',
            periodo: { inicio: periodoInicio, fim: periodoFim }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhum serviço utilizado no período',
          periodo: { inicio: periodoInicio, fim: periodoFim }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular valor total dos serviços
    const valorServicos = servicosCalculados.reduce((sum: number, s: any) => sum + Number(s.valor_total), 0)
    const valorTotal = valorServicos

    let faturaData: any

    // Se já existe rascunho, atualizar; senão, criar nova
    if (faturaRascunho) {
      const { data: faturaAtualizada, error: faturaError } = await supabase
        .from('faturas')
        .update({
          periodo_fim: periodoFim.toISOString().split('T')[0],
          valor_servicos: valorServicos,
          valor_total: valorTotal,
          observacoes: `Fatura atualizada automaticamente - Período: ${periodoInicio.toLocaleDateString('pt-BR')} até ${periodoFim.toLocaleDateString('pt-BR')}`
        })
        .eq('id', faturaRascunho.id)
        .select()
        .single()

      if (faturaError) throw faturaError
      faturaData = faturaAtualizada
      console.log('Fatura atualizada:', faturaData.id)
    } else {
      // Gerar número da fatura
      const anoMes = hoje.toISOString().slice(0, 7).replace('-', '')
      const { count } = await supabase
        .from('faturas')
        .select('*', { count: 'exact', head: true })
        .like('numero_fatura', `FAT-${anoMes}-%`)

      const sequencial = String((count || 0) + 1).padStart(3, '0')
      const numeroFatura = `FAT-${anoMes}-${sequencial}`

      console.log('Número da fatura:', numeroFatura)

      // Calcular data de vencimento
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      const dataVencimento = new Date(proximoMes)
      dataVencimento.setDate(dataVencimento.getDate() + (contrato.dia_vencimento || 10) - 1)

      // Inserir nova fatura em rascunho
      const { data: novaFatura, error: faturaError } = await supabase
        .from('faturas')
        .insert({
          numero_fatura: numeroFatura,
          contrato_id: contrato_id,
          franquia_id: contrato.franquia_id,
          produtor_id: contrato.produtor_id,
          periodo_inicio: periodoInicio.toISOString().split('T')[0],
          periodo_fim: periodoFim.toISOString().split('T')[0],
          status: 'rascunho',
          data_emissao: hoje.toISOString().split('T')[0],
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          valor_servicos: valorServicos,
          valor_total: valorTotal,
          observacoes: `Fatura em andamento - Período: ${periodoInicio.toLocaleDateString('pt-BR')} até ${periodoFim.toLocaleDateString('pt-BR')}`
        })
        .select()
        .single()

      if (faturaError) throw faturaError
      faturaData = novaFatura
      console.log('Fatura criada:', faturaData.id)
    }

    // Inserir itens da fatura
    const itensParaInserir = servicosCalculados.map((s: any) => ({
      fatura_id: faturaData.id,
      tipo_servico: s.tipo_servico,
      descricao: s.descricao,
      quantidade: s.quantidade,
      valor_unitario: s.valor_unitario,
      valor_total: s.valor_total,
      detalhes_calculo: s.detalhes_calculo
    }))

    const { error: itensError } = await supabase
      .from('fatura_itens')
      .insert(itensParaInserir)

    if (itensError) throw itensError

    console.log('Itens da fatura criados:', itensParaInserir.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        fatura: faturaData,
        itens: servicosCalculados,
        message: `Fatura ${faturaData.numero_fatura} gerada com sucesso!`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao gerar fatura:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
