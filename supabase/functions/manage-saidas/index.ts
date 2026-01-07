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
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Invalid authentication')

    const { action, data } = await req.json()

    let result
    switch (action) {
      case 'create': result = await createSaida(supabaseClient, user.id, data); break
      case 'update': result = await updateSaida(supabaseClient, user.id, data); break
      case 'delete': result = await deleteSaida(supabaseClient, user.id, data.id); break
      case 'update_status': result = await updateSaidaStatus(supabaseClient, user.id, data); break
      case 'approve': result = await approveSaida(supabaseClient, user.id, data); break
      case 'allocate_viagem': result = await allocateToViagem(supabaseClient, user.id, data); break
      case 'deallocate_viagem': result = await deallocateFromViagem(supabaseClient, user.id, data.saidaId); break
      case 'create_devolucao': result = await createDevolucao(supabaseClient, user.id, data); break
      default: throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-saidas:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Helper: buscar cliente por user_id ou deposito_id
async function findClienteOrigem(supabase: any, userId: string, depositoId?: string) {
  // Via cliente_usuarios
  const { data: cu } = await supabase
    .from('cliente_usuarios')
    .select('cliente_id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle()
  if (cu?.cliente_id) return cu.cliente_id

  if (!depositoId) return null

  // Via franquia CNPJ
  const { data: franquia } = await supabase
    .from('franquias')
    .select('cnpj')
    .eq('id', depositoId)
    .single()
  
  if (franquia?.cnpj) {
    const cnpjLimpo = franquia.cnpj.replace(/\D/g, '')
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .or(`cpf_cnpj.eq.${cnpjLimpo},cpf_cnpj.eq.${franquia.cnpj}`)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    if (cliente?.id) return cliente.id
  }
  return null
}

// Helper: buscar dados completos de um cliente
async function getClienteData(supabase: any, clienteId: string) {
  const { data } = await supabase
    .from('clientes')
    .select('id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal, cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial, email_comercial')
    .eq('id', clienteId)
    .single()
  return data
}

// Helper: buscar dados de franquia como emitente
async function getFranquiaAsEmitente(supabase: any, depositoId: string) {
  const { data: franquia } = await supabase
    .from('franquias')
    .select('id, nome, razao_social, cnpj, inscricao_estadual, endereco, numero, complemento, bairro, cidade, estado, cep, telefone, email')
    .eq('id', depositoId)
    .single()
  
  if (!franquia) return null
  return {
    razao_social: franquia.razao_social || franquia.nome,
    nome_fantasia: franquia.nome,
    cpf_cnpj: franquia.cnpj,
    inscricao_estadual: franquia.inscricao_estadual,
    endereco_fiscal: franquia.endereco,
    numero_fiscal: franquia.numero,
    complemento_fiscal: franquia.complemento,
    bairro_fiscal: franquia.bairro,
    cidade_fiscal: franquia.cidade,
    estado_fiscal: franquia.estado,
    cep_fiscal: franquia.cep,
    telefone_comercial: franquia.telefone,
    email_comercial: franquia.email
  }
}

async function createSaida(supabase: any, userId: string, data: any) {
  if (!data.data_saida || !data.itens || data.itens.length === 0) throw new Error('Missing required fields')
  if (!data.deposito_id) throw new Error('deposito_id é obrigatório para rastreabilidade FEFO')

  // Buscar cliente origem e dados do emitente
  let clienteOrigemId = data.cliente_origem_id || await findClienteOrigem(supabase, userId, data.deposito_id)
  let clienteEmitenteData = clienteOrigemId ? await getClienteData(supabase, clienteOrigemId) : null
  if (!clienteEmitenteData && data.deposito_id) {
    clienteEmitenteData = await getFranquiaAsEmitente(supabase, data.deposito_id)
  }

  // Buscar dados do destinatário
  const clienteDestinatarioData = data.cliente_destinatario_id ? await getClienteData(supabase, data.cliente_destinatario_id) : null

  // Calcular valores
  const valorProdutos = data.itens.reduce((sum: number, item: any) => sum + ((item.quantidade || 0) * (item.valor_unitario || item.preco_unitario || 0)), 0)
  const valorFrete = data.valor_frete || 0
  const valorSeguro = data.valor_seguro || 0
  const valorDesconto = data.valor_desconto || 0
  const outrasDespesas = data.outras_despesas || 0
  const valorTotal = valorProdutos + valorFrete + valorSeguro + outrasDespesas - valorDesconto
  const pesoTotal = data.itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)

  // Transportadora
  let transportadoraData: any = null
  if (data.modalidade_frete === '0' && data.usar_transportadora_propria && clienteEmitenteData) {
    transportadoraData = {
      transportadora_nome: clienteEmitenteData.razao_social,
      transportadora_cnpj: clienteEmitenteData.cpf_cnpj,
      transportadora_ie: clienteEmitenteData.inscricao_estadual,
      transportadora_endereco: clienteEmitenteData.endereco_fiscal,
      transportadora_municipio: clienteEmitenteData.cidade_fiscal,
      transportadora_uf: clienteEmitenteData.estado_fiscal
    }
  } else if (data.transportadora_id) {
    const { data: t } = await supabase.from('transportadoras').select('nome, cnpj').eq('id', data.transportadora_id).single()
    if (t) transportadoraData = { transportadora_nome: t.nome, transportadora_cnpj: t.cnpj }
  }

  const { itens, reserva_id, usar_transportadora_propria, ...saidaFields } = data
  const saidaData = {
    user_id: userId,
    ...saidaFields,
    cliente_origem_id: clienteOrigemId,
    peso_total: pesoTotal,
    peso_bruto: data.peso_bruto || pesoTotal,
    peso_liquido: data.peso_liquido || pesoTotal,
    status: 'separacao_pendente',
    status_aprovacao_produtor: userId === data.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    // Emitente
    emitente_nome: clienteEmitenteData?.razao_social || null,
    emitente_nome_fantasia: clienteEmitenteData?.nome_fantasia || null,
    emitente_cnpj: clienteEmitenteData?.cpf_cnpj || null,
    emitente_ie: clienteEmitenteData?.inscricao_estadual || null,
    emitente_logradouro: clienteEmitenteData?.endereco_fiscal || null,
    emitente_numero: clienteEmitenteData?.numero_fiscal || null,
    emitente_complemento: clienteEmitenteData?.complemento_fiscal || null,
    emitente_bairro: clienteEmitenteData?.bairro_fiscal || null,
    emitente_municipio: clienteEmitenteData?.cidade_fiscal || null,
    emitente_uf: clienteEmitenteData?.estado_fiscal || null,
    emitente_cep: clienteEmitenteData?.cep_fiscal || null,
    emitente_telefone: clienteEmitenteData?.telefone_comercial || null,
    emitente_email: clienteEmitenteData?.email_comercial || null,
    // Destinatário
    destinatario_nome: clienteDestinatarioData?.razao_social || null,
    destinatario_cpf_cnpj: clienteDestinatarioData?.cpf_cnpj || null,
    destinatario_ie: clienteDestinatarioData?.inscricao_estadual || null,
    destinatario_logradouro: clienteDestinatarioData?.endereco_fiscal || null,
    destinatario_numero: clienteDestinatarioData?.numero_fiscal || null,
    destinatario_complemento: clienteDestinatarioData?.complemento_fiscal || null,
    destinatario_bairro: clienteDestinatarioData?.bairro_fiscal || null,
    destinatario_municipio: clienteDestinatarioData?.cidade_fiscal || null,
    destinatario_uf: clienteDestinatarioData?.estado_fiscal || null,
    destinatario_cep: clienteDestinatarioData?.cep_fiscal || null,
    destinatario_telefone: clienteDestinatarioData?.telefone_comercial || null,
    destinatario_email: clienteDestinatarioData?.email_comercial || null,
    // Transportadora e valores
    ...transportadoraData,
    valor_produtos: valorProdutos,
    valor_frete: valorFrete,
    valor_seguro: valorSeguro,
    valor_desconto: valorDesconto,
    outras_despesas: outrasDespesas,
    valor_total: valorTotal,
    quantidade_volumes: data.quantidade_volumes || 0,
    numero_nfe: data.numero_nfe || null,
    serie_nfe: data.serie_nfe || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: saida, error: saidaError } = await supabase.from('saidas').insert(saidaData).select().single()
  if (saidaError) throw saidaError

  try {
    if (reserva_id) {
      await supabase.from('reservas_horario').update({ saida_id: saida.id }).eq('id', reserva_id)
    }

    const shouldAllocateStock = data.movimenta_estoque !== 'nao_movimenta'
    const isStockEntry = data.movimenta_estoque === 'entrada'
    const itensInseridos = []
    
    for (const item of data.itens) {
      const { data: saidaItem, error: itemError } = await supabase
        .from('saida_itens')
        .insert({ ...item, saida_id: saida.id, user_id: userId, created_at: new Date().toISOString() })
        .select()
        .single()
      if (itemError) throw new Error(`Erro ao criar item: ${itemError.message}`)

      if (shouldAllocateStock && !isStockEntry) {
        const { data: alocacaoResult, error: alocacaoError } = await supabase
          .rpc('validar_e_alocar_estoque_fefo', {
            p_produto_id: item.produto_id,
            p_deposito_id: data.deposito_id,
            p_quantidade_necessaria: item.quantidade,
            p_saida_item_id: saidaItem.id
          })
        if (alocacaoError) throw new Error(`Erro ao alocar estoque FEFO: ${alocacaoError.message}`)

        const { data: refs } = await supabase
          .from('saida_item_referencias')
          .select('lote, quantidade')
          .eq('saida_item_id', saidaItem.id)
          .order('created_at', { ascending: true })
        
        if (refs?.length) {
          const lote = refs.length === 1 ? refs[0].lote : 'MULTI'
          await supabase.from('saida_itens').update({ lote }).eq('id', saidaItem.id)
          saidaItem.lote = lote
        }
      }
      itensInseridos.push(saidaItem)
    }

    // Generate CT-e if entrega_fazenda
    let cte = null
    if (data.tipo_saida === 'entrega_fazenda') {
      try { cte = await generateCTe(supabase, userId, saida, data) } catch (e) { console.error('CT-e error:', e) }
    }

    // Fluxo interno
    let documentoFluxo = null
    try { documentoFluxo = await processarFluxoDocumentoInterno(supabase, userId, saida, data) } catch (e) { console.error('Fluxo error:', e) }

    return { ...saida, itens: itensInseridos, cte, documento_fluxo: documentoFluxo }
  } catch (error) {
    await supabase.from('saidas').delete().eq('id', saida.id)
    throw error
  }
}

async function generateCTe(supabase: any, userId: string, saida: any, saidaData: any) {
  const { data: franquia } = await supabase.from('franquias').select('*').eq('id', saida.deposito_id).single()
  if (!franquia) throw new Error('Franquia não encontrada para gerar CT-e')
  
  const { data: fazenda } = await supabase.from('fazendas').select('*').eq('id', saida.fazenda_id).single()
  if (!fazenda) throw new Error('Fazenda não encontrada para gerar CT-e')
  
  const { data: produtor } = await supabase.from('profiles').select('*').eq('user_id', saida.produtor_destinatario_id).single()
  if (!produtor) throw new Error('Produtor não encontrado para gerar CT-e')
  
  const { data: lastCte } = await supabase.from('ctes').select('numero_cte').order('created_at', { ascending: false }).limit(1).single()
  let nextNumber = 1
  if (lastCte?.numero_cte) nextNumber = parseInt(lastCte.numero_cte.split('-')[1] || '0') + 1
  
  const cteData = {
    saida_id: saida.id,
    numero_cte: `CTE-${String(nextNumber).padStart(8, '0')}`,
    serie: '1', modelo: '57', data_emissao: new Date().toISOString(),
    tipo_ambiente: 'homologacao', tipo_cte: 'normal', cfop: '5353',
    natureza_operacao: 'Prestação de serviço de transporte', modal: '01', tipo_servico: '0',
    municipio_envio_codigo: franquia.codigo_municipio, municipio_envio_nome: franquia.cidade, municipio_envio_uf: franquia.estado,
    municipio_inicio_codigo: franquia.codigo_municipio, municipio_inicio_nome: franquia.cidade, municipio_inicio_uf: franquia.estado,
    municipio_fim_codigo: fazenda.codigo_municipio, municipio_fim_nome: fazenda.cidade, municipio_fim_uf: fazenda.estado,
    emitente_cnpj: franquia.cnpj, emitente_ie: franquia.inscricao_estadual, emitente_nome: franquia.razao_social || franquia.nome, emitente_fantasia: franquia.nome,
    emitente_endereco: { logradouro: franquia.endereco, numero: franquia.numero, bairro: franquia.bairro, municipio: franquia.cidade, uf: franquia.estado, cep: franquia.cep, fone: franquia.telefone },
    remetente_cnpj: franquia.cnpj, remetente_ie: franquia.inscricao_estadual, remetente_nome: franquia.razao_social || franquia.nome, remetente_fantasia: franquia.nome, remetente_fone: franquia.telefone,
    remetente_endereco: { logradouro: franquia.endereco, numero: franquia.numero, bairro: franquia.bairro, municipio: franquia.cidade, uf: franquia.estado, cep: franquia.cep },
    destinatario_cnpj: fazenda.cpf_cnpj, destinatario_ie: fazenda.inscricao_estadual, destinatario_nome: fazenda.nome, destinatario_fone: fazenda.telefone,
    destinatario_endereco: { logradouro: fazenda.endereco, numero: fazenda.numero, bairro: fazenda.bairro, municipio: fazenda.cidade, uf: fazenda.estado, cep: fazenda.cep },
    tomador_tipo: '3', tomador_cnpj: produtor.cpf_cnpj, tomador_nome: produtor.nome, tomador_endereco: produtor.endereco ? JSON.parse(produtor.endereco) : null,
    valor_total_servico: saidaData.valor_frete_calculado || 0, valor_receber: saidaData.valor_frete_calculado || 0,
    componentes_valor: [{ nome: 'Frete', valor: saidaData.valor_frete_calculado || 0 }],
    icms_situacao_tributaria: '00', icms_base_calculo: saidaData.valor_frete_calculado || 0, icms_aliquota: 0, icms_valor: 0, valor_total_tributos: 0,
    valor_carga: 0, produto_predominante: 'Produtos agrícolas', outras_caracteristicas: 'Transporte de produtos agrícolas',
    quantidades: [{ unidade: 'KG', tipo: 'Peso', quantidade: saida.peso_total || 0 }],
    responsavel_seguro: '1', status: 'rascunho', created_by: userId
  }
  
  const { data: cte, error } = await supabase.from('ctes').insert(cteData).select().single()
  if (error) throw error
  return cte
}

async function updateSaida(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  const { data: saida, error } = await supabase.from('saidas').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return saida
}

async function deleteSaida(supabase: any, userId: string, saidaId: string) {
  const { error } = await supabase.from('saidas').delete().eq('id', saidaId).eq('user_id', userId)
  if (error) throw error
  return { id: saidaId }
}

async function updateSaidaStatus(supabase: any, userId: string, data: any) {
  const { id, status, observacoes } = data
  const { data: saida, error } = await supabase.from('saidas').update({ status, observacoes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return saida
}

async function approveSaida(supabase: any, userId: string, data: any) {
  const { id, status_aprovacao, observacoes } = data
  const updateData: any = { status_aprovacao_produtor: status_aprovacao, updated_at: new Date().toISOString() }
  if (observacoes) updateData.observacoes = observacoes
  if (status_aprovacao === 'aprovado') updateData.data_aprovacao_produtor = new Date().toISOString()
  const { data: saida, error } = await supabase.from('saidas').update(updateData).eq('id', id).select().single()
  if (error) throw error
  return saida
}

async function allocateToViagem(supabase: any, userId: string, data: any) {
  const { viagemId, saidaId } = data
  const { data: saida, error } = await supabase.from('saidas').update({ viagem_id: viagemId, status: 'alocado_viagem', updated_at: new Date().toISOString() }).eq('id', saidaId).select().single()
  if (error) throw error
  await supabase.from('entradas').update({ viagem_id: viagemId, updated_at: new Date().toISOString() }).eq('saida_origem_id', saidaId)
  return saida
}

async function deallocateFromViagem(supabase: any, userId: string, saidaId: string) {
  const { data: saida, error } = await supabase.from('saidas').update({ viagem_id: null, status: 'expedido', updated_at: new Date().toISOString() }).eq('id', saidaId).select().single()
  if (error) throw error
  return saida
}

async function createDevolucao(supabase: any, userId: string, data: any) {
  const { ocorrencia_id, saida_id, tipo_devolucao, itens_devolvidos, observacoes } = data
  
  const { data: saida, error: saidaError } = await supabase
    .from('saidas')
    .select('*, deposito:franquias!deposito_id(id, nome, master_franqueado_id), produtor_destinatario:profiles!produtor_destinatario_id(id, nome, cpf_cnpj), saida_itens(id, produto_id, quantidade, valor_unitario, lote, produtos(id, nome, codigo, unidade_medida))')
    .eq('id', saida_id)
    .single()
  if (saidaError || !saida) throw new Error('Saída não encontrada')
  if (!['expedido', 'entregue'].includes(saida.status)) throw new Error('Devolução só pode ser criada para saídas expedidas ou entregues')

  const entradaData = {
    user_id: saida.user_id,
    deposito_id: saida.deposito_id,
    data_entrada: new Date().toISOString(),
    tipo_entrada: 'devolucao',
    numero_nfe: `DEV-${saida.id.substring(0, 8)}`,
    emitente_cnpj: saida.produtor_destinatario?.cpf_cnpj || '',
    emitente_nome: saida.produtor_destinatario?.nome || 'Cliente',
    destinatario_cpf_cnpj: saida.deposito?.master_franqueado_id || '',
    destinatario_nome: saida.deposito?.nome || 'Depósito',
    observacoes: observacoes || `Devolução ${tipo_devolucao === 'total' ? 'total' : 'parcial'} - Saída: ${saida.id}`,
    status_aprovacao: 'aguardando_conferencia',
    saida_origem_id: saida_id
  }

  const { data: entrada, error: entradaError } = await supabase.from('entradas').insert(entradaData).select().single()
  if (entradaError) throw entradaError

  const itensEntrada = tipo_devolucao === 'total'
    ? saida.saida_itens.map((i: any) => ({ entrada_id: entrada.id, user_id: saida.user_id, produto_id: i.produto_id, nome_produto: i.produtos.nome, codigo_produto: i.produtos.codigo, unidade_comercial: i.produtos.unidade_medida, quantidade: i.quantidade, valor_unitario: i.valor_unitario, lote: i.lote, valor_total: i.quantidade * i.valor_unitario }))
    : itens_devolvidos.map((itemDev: any) => {
        const orig = saida.saida_itens.find((si: any) => si.id === itemDev.saida_item_id)
        if (!orig) throw new Error(`Item ${itemDev.saida_item_id} não encontrado`)
        return { entrada_id: entrada.id, user_id: saida.user_id, produto_id: orig.produto_id, nome_produto: orig.produtos.nome, codigo_produto: orig.produtos.codigo, unidade_comercial: orig.produtos.unidade_medida, quantidade: itemDev.quantidade, valor_unitario: orig.valor_unitario, lote: orig.lote, valor_total: itemDev.quantidade * orig.valor_unitario }
      })

  const { error: itensError } = await supabase.from('entrada_itens').insert(itensEntrada)
  if (itensError) { await supabase.from('entradas').delete().eq('id', entrada.id); throw itensError }

  await supabase.from('saidas').update({ status: tipo_devolucao === 'total' ? 'em_devolucao' : saida.status, updated_at: new Date().toISOString() }).eq('id', saida_id)
  await supabase.from('ocorrencias').update({ requer_devolucao: true, devolucao_id: entrada.id, quantidade_devolvida: tipo_devolucao === 'total' ? { tipo: 'total', itens: itensEntrada.length } : { tipo: 'parcial', itens: itens_devolvidos }, updated_at: new Date().toISOString() }).eq('id', ocorrencia_id)

  return { entrada_id: entrada.id, saida_id, tipo_devolucao, itens_count: itensEntrada.length }
}

// Fluxo documento interno
async function processarFluxoDocumentoInterno(supabase: any, userId: string, saida: any, data: any) {
  const destinatarioInterno = await detectarDestinatarioInterno(supabase, data)
  if (!destinatarioInterno) return null

  let clienteOrigemId = await findClienteOrigem(supabase, userId, saida.deposito_id)
  if (!clienteOrigemId) {
    // Criar entrada sem fluxo
    const entrada = await criarEntradaAutomatica(supabase, saida, destinatarioInterno, null, data)
    if (destinatarioInterno.operador_logistico_id) await notificarWMSOperador(supabase, entrada, destinatarioInterno.operador_logistico_id)
    return null
  }

  let tipoFluxo = data.finalidade_nfe === 'transferencia' ? 'transferencia' : data.finalidade_nfe === 'remessa' ? 'remessa' : data.finalidade_nfe === 'devolucao' ? 'devolucao' : 'venda'
  
  const { data: fluxo, error } = await supabase.from('documento_fluxo').insert({
    saida_id: saida.id, cliente_origem_id: clienteOrigemId, cliente_destino_id: destinatarioInterno.id,
    tipo_fluxo: tipoFluxo, chave_nfe: data.chave_nfe || null, operador_deposito_id: destinatarioInterno.operador_logistico_id || null, transportadora_id: data.transportadora_id || null, status: 'pendente'
  }).select().single()
  if (error) throw error

  const entrada = await criarEntradaAutomatica(supabase, saida, destinatarioInterno, fluxo, data)
  if (destinatarioInterno.operador_logistico_id) await notificarWMSOperador(supabase, entrada, destinatarioInterno.operador_logistico_id)
  if (data.transportadora_id) await notificarTMSTransportadora(supabase, saida, data.transportadora_id)
  return fluxo
}

async function detectarDestinatarioInterno(supabase: any, data: any) {
  if (data.cliente_destinatario_id) {
    const { data: c } = await supabase.from('clientes').select('*, cliente_depositos(*)').eq('id', data.cliente_destinatario_id).eq('ativo', true).single()
    if (c) return c
  }
  if (data.finalidade_nfe === 'transferencia' && data.destinatario_transferencia_id) {
    const { data: c } = await supabase.from('clientes').select('*, cliente_depositos(*)').eq('id', data.destinatario_transferencia_id).single()
    return c
  }
  const cpfCnpj = data.destinatario_cpf_cnpj || data.produtor_destinatario_cpf_cnpj
  if (!cpfCnpj && data.produtor_destinatario_id) {
    const { data: p } = await supabase.from('profiles').select('cpf_cnpj').eq('user_id', data.produtor_destinatario_id).single()
    if (p?.cpf_cnpj) {
      const { data: c } = await supabase.from('clientes').select('*, cliente_depositos(*)').eq('cpf_cnpj', p.cpf_cnpj).eq('ativo', true).maybeSingle()
      return c
    }
    return null
  }
  if (!cpfCnpj) return null
  const clean = cpfCnpj.replace(/\D/g, '')
  const { data: c } = await supabase.from('clientes').select('*, cliente_depositos(*)').or(`cpf_cnpj.eq.${clean},cpf_cnpj.eq.${cpfCnpj}`).eq('ativo', true).maybeSingle()
  return c
}

async function criarEntradaAutomatica(supabase: any, saida: any, clienteDestino: any, fluxo: any, data: any) {
  const { data: saidaItens } = await supabase.from('saida_itens').select('*, produtos(id, nome, codigo, unidade_medida, preco_unitario)').eq('saida_id', saida.id)
  
  let clienteOrigemData = saida.cliente_origem_id ? await getClienteData(supabase, saida.cliente_origem_id) : null
  if (!clienteOrigemData && saida.deposito_id) clienteOrigemData = await getFranquiaAsEmitente(supabase, saida.deposito_id)

  const valorProdutos = saidaItens?.reduce((s: number, i: any) => s + (i.quantidade || 0) * (i.valor_unitario || 0), 0) || 0
  const quantidadeVolumes = saidaItens?.reduce((s: number, i: any) => s + (i.quantidade || 0), 0) || 0

  let depositoDestinoId = clienteDestino.operador_logistico_id
  if (!depositoDestinoId && clienteDestino.cliente_depositos?.length) {
    depositoDestinoId = clienteDestino.cliente_depositos.find((d: any) => d.ativo !== false)?.franquia_id
  }

  const { data: usuarioDestino } = await supabase.from('cliente_usuarios').select('user_id').eq('cliente_id', clienteDestino.id).eq('ativo', true).limit(1).single()
  const userIdDestino = usuarioDestino?.user_id

  const naturezaOperacao = data.finalidade_nfe === 'transferencia' ? 'Transferência entre estabelecimentos' : data.finalidade_nfe === 'remessa' ? 'Recebimento de mercadoria em remessa' : data.finalidade_nfe === 'devolucao' ? 'Recebimento de devolução' : 'Compra de mercadorias'

  const { data: entrada, error } = await supabase.from('entradas').insert({
    user_id: userIdDestino || saida.user_id, deposito_id: depositoDestinoId, cliente_id: clienteDestino.id,
    data_entrada: new Date().toISOString().split('T')[0], numero_nfe: saida.numero_nfe || `INT-${saida.id.substring(0, 8)}`,
    chave_nfe: saida.chave_nfe || null, serie: saida.serie_nfe || null,
    emitente_nome: clienteOrigemData?.razao_social || 'Fornecedor Interno', emitente_nome_fantasia: clienteOrigemData?.nome_fantasia,
    emitente_cnpj: clienteOrigemData?.cpf_cnpj || '', emitente_ie: clienteOrigemData?.inscricao_estadual,
    emitente_logradouro: clienteOrigemData?.endereco_fiscal, emitente_numero: clienteOrigemData?.numero_fiscal,
    emitente_complemento: clienteOrigemData?.complemento_fiscal, emitente_bairro: clienteOrigemData?.bairro_fiscal,
    emitente_municipio: clienteOrigemData?.cidade_fiscal, emitente_uf: clienteOrigemData?.estado_fiscal,
    emitente_cep: clienteOrigemData?.cep_fiscal, emitente_telefone: clienteOrigemData?.telefone_comercial,
    destinatario_nome: clienteDestino.razao_social, destinatario_cpf_cnpj: clienteDestino.cpf_cnpj,
    destinatario_ie: clienteDestino.inscricao_estadual, destinatario_logradouro: clienteDestino.endereco_fiscal,
    destinatario_numero: clienteDestino.numero_fiscal, destinatario_complemento: clienteDestino.complemento_fiscal,
    destinatario_bairro: clienteDestino.bairro_fiscal, destinatario_municipio: clienteDestino.cidade_fiscal,
    destinatario_uf: clienteDestino.estado_fiscal, destinatario_cep: clienteDestino.cep_fiscal,
    destinatario_telefone: clienteDestino.telefone_comercial,
    peso_bruto: saida.peso_total, peso_liquido: saida.peso_total,
    valor_total: saida.valor_total || valorProdutos, valor_produtos: saida.valor_produtos || valorProdutos,
    valor_frete: saida.valor_frete, valor_seguro: saida.valor_seguro, quantidade_volumes: quantidadeVolumes,
    dh_emissao: saida.data_saida ? new Date(saida.data_saida).toISOString() : null, dh_saida_entrada: new Date().toISOString(),
    status_aprovacao: 'pendente_aprovacao', tipo_recebimento: 'edi_interno', saida_origem_id: saida.id,
    documento_fluxo_id: fluxo?.id, natureza_operacao, observacoes: `Documento recebido automaticamente via EDI interno - Saída: ${saida.id}`
  }).select().single()
  if (error) throw error

  if (saidaItens?.length) {
    const itensEntrada = saidaItens.map((i: any) => ({
      entrada_id: entrada.id, user_id: userIdDestino || saida.user_id, produto_id: i.produto_id,
      nome_produto: i.produtos?.nome || 'Produto', codigo_produto: i.produtos?.codigo || i.codigo_produto,
      unidade_comercial: i.produtos?.unidade_medida || 'UN', quantidade: i.quantidade, valor_unitario: i.valor_unitario || 0,
      lote: i.lote, valor_total: (i.quantidade || 0) * (i.valor_unitario || 0)
    }))
    await supabase.from('entrada_itens').insert(itensEntrada)
  }

  if (fluxo?.id) await supabase.from('documento_fluxo').update({ entrada_id: entrada.id }).eq('id', fluxo.id)
  await supabase.from('saidas').update({ entrada_gerada_id: entrada.id }).eq('id', saida.id)
  return entrada
}

async function notificarWMSOperador(supabase: any, entrada: any, operadorDepositoId: string) {
  const { data: users } = await supabase.from('franquia_usuarios').select('user_id').eq('franquia_id', operadorDepositoId).eq('ativo', true)
  if (!users?.length) return
  const notifs = users.map((u: any) => ({ user_id: u.user_id, titulo: '📦 Nova NF-e para Recebimento', mensagem: `NF ${entrada.numero_nfe || entrada.id.substring(0, 8)} de ${entrada.emitente_nome} aguardando recebimento no WMS`, tipo: 'wms_recebimento', referencia_id: entrada.id, referencia_tipo: 'entrada', lida: false }))
  await supabase.from('notifications').insert(notifs)
}

async function notificarTMSTransportadora(supabase: any, saida: any, transportadoraId: string) {
  const { data: users } = await supabase.from('transportadoras_usuarios').select('user_id').eq('transportadora_id', transportadoraId).eq('ativo', true)
  if (!users?.length) return
  const notifs = users.map((u: any) => ({ user_id: u.user_id, titulo: '🚚 Nova Remessa para Coleta', mensagem: `Remessa ${saida.id.substring(0, 8)} aguardando coleta`, tipo: 'tms_coleta', referencia_id: saida.id, referencia_tipo: 'saida', lida: false }))
  await supabase.from('notifications').insert(notifs)
}
