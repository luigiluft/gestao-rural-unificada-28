import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServicoContrato {
  id: string
  tipo_servico: string
  descricao: string
  quantidade_incluida: number | null
  quantidade_minima: number | null
  valor_unitario: number
  valor_excedente: number | null
}

interface CalculoServico {
  tipo_servico: string
  descricao: string
  quantidade_utilizada: number
  quantidade_incluida: number
  quantidade_minima: number
  quantidade_faturada: number
  valor_unitario: number
  valor_excedente: number | null
  valor_total: number
  detalhes_calculo: any
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

    // Buscar serviços do contrato
    const { data: servicos, error: servicosError } = await supabase
      .from('contrato_servicos_itens')
      .select('*')
      .eq('contrato_id', contrato_id)

    if (servicosError) throw servicosError

    console.log('Serviços encontrados:', servicos?.length)

    // Calcular período de faturamento
    const hoje = new Date()
    let periodoInicio: Date
    let periodoFim: Date

    switch (contrato.tipo_cobranca) {
      case 'mensal':
        periodoInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        periodoFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        break
      case 'semanal':
        periodoFim = new Date(hoje)
        periodoFim.setDate(hoje.getDate() - 1)
        periodoInicio = new Date(periodoFim)
        periodoInicio.setDate(periodoFim.getDate() - 6)
        break
      case 'quinzenal':
        periodoFim = new Date(hoje)
        periodoFim.setDate(hoje.getDate() - 1)
        periodoInicio = new Date(periodoFim)
        periodoInicio.setDate(periodoFim.getDate() - 14)
        break
      case 'anual':
        periodoInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1)
        periodoFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        break
      default:
        throw new Error('Tipo de cobrança inválido')
    }

    console.log('Período:', periodoInicio.toISOString(), 'até', periodoFim.toISOString())

    // Verificar se já existe fatura para este período
    const { data: faturaExistente } = await supabase
      .from('faturas')
      .select('id, numero_fatura')
      .eq('contrato_id', contrato_id)
      .eq('periodo_inicio', periodoInicio.toISOString().split('T')[0])
      .eq('periodo_fim', periodoFim.toISOString().split('T')[0])
      .maybeSingle()

    if (faturaExistente) {
      return new Response(
        JSON.stringify({ 
          error: `Já existe fatura para este período: ${faturaExistente.numero_fatura}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calcular quantidade utilizada por tipo de serviço
    const calculos: CalculoServico[] = []

    for (const servico of servicos as ServicoContrato[]) {
      let quantidadeUtilizada = 0
      let detalhesCalculo: any = {}

      if (servico.tipo_servico === 'entrada_item') {
        // Contar pallets de entradas confirmadas no período
        const { data: entradas } = await supabase
          .from('entradas')
          .select('id')
          .eq('user_id', contrato.produtor_id)
          .eq('deposito_id', contrato.franquia_id)
          .eq('status_aprovacao', 'confirmado')
          .gte('data_entrada', periodoInicio.toISOString().split('T')[0])
          .lte('data_entrada', periodoFim.toISOString().split('T')[0])

        if (entradas && entradas.length > 0) {
          const entradaIds = entradas.map(e => e.id)
          
          const { count: palletCount } = await supabase
            .from('entrada_pallets')
            .select('*', { count: 'exact', head: true })
            .in('entrada_id', entradaIds)
          
          quantidadeUtilizada = palletCount || 0
        } else {
          quantidadeUtilizada = 0
        }
        
        detalhesCalculo = { tipo: 'entrada_item', pallets_recebidos: quantidadeUtilizada, entradas_confirmadas: entradas?.length || 0 }

      } else if (servico.tipo_servico === 'saida_item') {
        // Contar itens de saídas expedidas no período
        const { data: saidas } = await supabase
          .from('saidas')
          .select('id')
          .eq('user_id', contrato.produtor_id)
          .eq('deposito_id', contrato.franquia_id)
          .eq('status', 'expedido')
          .gte('data_saida', periodoInicio.toISOString().split('T')[0])
          .lte('data_saida', periodoFim.toISOString().split('T')[0])

        if (saidas && saidas.length > 0) {
          const saidaIds = saidas.map(s => s.id)
          
          const { count: itemCount } = await supabase
            .from('saida_itens')
            .select('*', { count: 'exact', head: true })
            .in('saida_id', saidaIds)
          
          quantidadeUtilizada = itemCount || 0
        } else {
          quantidadeUtilizada = 0
        }
        
        detalhesCalculo = { tipo: 'saida_item', itens_expedidos: quantidadeUtilizada, saidas_expedidas: saidas?.length || 0 }

      } else if (servico.tipo_servico === 'armazenagem_pallet_dia') {
        // Calcular pallet-dias (pallets em estoque × dias no período)
        const diasNoPeriodo = Math.ceil((periodoFim.getTime() - periodoInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // Buscar entradas do produtor no depósito
        const { data: entradas } = await supabase
          .from('entradas')
          .select('id')
          .eq('user_id', contrato.produtor_id)
          .eq('deposito_id', contrato.franquia_id)

        if (entradas && entradas.length > 0) {
          const entradaIds = entradas.map(e => e.id)
          
          // Contar pallets com quantidade atual > 0
          const { count: palletCount } = await supabase
            .from('entrada_pallets')
            .select('*', { count: 'exact', head: true })
            .in('entrada_id', entradaIds)
            .gt('quantidade_atual', 0)
          
          const totalPallets = palletCount || 0
          quantidadeUtilizada = totalPallets * diasNoPeriodo
        } else {
          quantidadeUtilizada = 0
        }
        
        detalhesCalculo = { 
          tipo: 'armazenagem_pallet_dia', 
          dias_no_periodo: diasNoPeriodo,
          pallets_em_estoque: Math.round(quantidadeUtilizada / diasNoPeriodo),
          pallet_dias: quantidadeUtilizada
        }
      }

      // Aplicar lógica de cobrança
      const quantidadeIncluida = servico.quantidade_incluida || 0
      const quantidadeMinima = servico.quantidade_minima || 0
      let quantidadeFaturada = 0
      let valorTotal = 0

      if (quantidadeUtilizada <= quantidadeIncluida) {
        // Usar quantidade mínima se houver
        quantidadeFaturada = Math.max(quantidadeUtilizada, quantidadeMinima)
        valorTotal = quantidadeFaturada * servico.valor_unitario
      } else {
        // Quantidade excedente
        const excedente = quantidadeUtilizada - quantidadeIncluida
        const valorIncluido = quantidadeIncluida * servico.valor_unitario
        const valorExcedente = excedente * (servico.valor_excedente || servico.valor_unitario)
        
        quantidadeFaturada = quantidadeUtilizada
        valorTotal = valorIncluido + valorExcedente
      }

      calculos.push({
        tipo_servico: servico.tipo_servico,
        descricao: servico.descricao || servico.tipo_servico,
        quantidade_utilizada: quantidadeUtilizada,
        quantidade_incluida: quantidadeIncluida,
        quantidade_minima: quantidadeMinima,
        quantidade_faturada: quantidadeFaturada,
        valor_unitario: servico.valor_unitario,
        valor_excedente: servico.valor_excedente,
        valor_total: valorTotal,
        detalhes_calculo: detalhesCalculo
      })
    }

    const valorServicos = calculos.reduce((sum, c) => sum + c.valor_total, 0)
    const valorTotal = valorServicos // Pode adicionar descontos/acréscimos depois

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
    const dataVencimento = new Date(periodoFim)
    dataVencimento.setDate(dataVencimento.getDate() + (contrato.dia_vencimento || 10))

    // Inserir fatura
    const { data: faturaData, error: faturaError } = await supabase
      .from('faturas')
      .insert({
        numero_fatura: numeroFatura,
        contrato_id: contrato_id,
        franquia_id: contrato.franquia_id,
        produtor_id: contrato.produtor_id,
        periodo_inicio: periodoInicio.toISOString().split('T')[0],
        periodo_fim: periodoFim.toISOString().split('T')[0],
        data_emissao: hoje.toISOString().split('T')[0],
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        valor_servicos: valorServicos,
        valor_total: valorTotal,
        status: 'pendente',
        observacoes: `Fatura gerada automaticamente para o período de ${periodoInicio.toLocaleDateString('pt-BR')} a ${periodoFim.toLocaleDateString('pt-BR')}`
      })
      .select()
      .single()

    if (faturaError) throw faturaError

    console.log('Fatura criada:', faturaData.id)

    // Inserir itens da fatura
    const itensParaInserir = calculos.map(calc => ({
      fatura_id: faturaData.id,
      tipo_servico: calc.tipo_servico,
      descricao: calc.descricao,
      quantidade: calc.quantidade_faturada,
      valor_unitario: calc.valor_unitario,
      valor_total: calc.valor_total,
      detalhes_calculo: calc.detalhes_calculo
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
        itens: calculos,
        message: `Fatura ${numeroFatura} gerada com sucesso!`
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
