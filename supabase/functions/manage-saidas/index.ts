import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Invalid authentication')

    const { action, data } = await req.json()
    let result
    switch (action) {
      case 'create': result = await createSaida(supabase, user.id, data); break
      case 'update': result = await updateSaida(supabase, user.id, data); break
      case 'delete': result = await deleteSaida(supabase, user.id, data.id); break
      case 'update_status': result = await updateStatus(supabase, data); break
      case 'approve': result = await approveSaida(supabase, data); break
      case 'allocate_viagem': result = await allocateViagem(supabase, data); break
      case 'deallocate_viagem': result = await deallocateViagem(supabase, data.saidaId); break
      case 'create_devolucao': result = await createDevolucao(supabase, user.id, data); break
      default: throw new Error('Invalid action')
    }
    return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function getCliente(sb: any, id: string) {
  const { data } = await sb.from('clientes').select('id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual, endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal, cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial, email_comercial').eq('id', id).single()
  return data
}

async function findClienteOrigem(sb: any, userId: string, depositoId?: string) {
  const { data: cu } = await sb.from('cliente_usuarios').select('cliente_id').eq('user_id', userId).eq('ativo', true).limit(1).maybeSingle()
  if (cu?.cliente_id) return cu.cliente_id
  if (!depositoId) return null
  const { data: f } = await sb.from('franquias').select('cnpj').eq('id', depositoId).single()
  if (f?.cnpj) {
    const cnpj = f.cnpj.replace(/\D/g, '')
    const { data: c } = await sb.from('clientes').select('id').or(`cpf_cnpj.eq.${cnpj},cpf_cnpj.eq.${f.cnpj}`).eq('ativo', true).limit(1).maybeSingle()
    if (c?.id) return c.id
  }
  return null
}

async function createSaida(sb: any, userId: string, data: any) {
  if (!data.data_saida || !data.itens?.length) throw new Error('Missing required fields')
  if (!data.deposito_id) throw new Error('deposito_id é obrigatório')

  const clienteOrigemId = data.cliente_origem_id || await findClienteOrigem(sb, userId, data.deposito_id)
  let emitente = clienteOrigemId ? await getCliente(sb, clienteOrigemId) : null
  if (!emitente && data.deposito_id) {
    const { data: f } = await sb.from('franquias').select('*').eq('id', data.deposito_id).single()
    if (f) emitente = { razao_social: f.razao_social || f.nome, nome_fantasia: f.nome, cpf_cnpj: f.cnpj, inscricao_estadual: f.inscricao_estadual, endereco_fiscal: f.endereco, numero_fiscal: f.numero, complemento_fiscal: f.complemento, bairro_fiscal: f.bairro, cidade_fiscal: f.cidade, estado_fiscal: f.estado, cep_fiscal: f.cep, telefone_comercial: f.telefone, email_comercial: f.email }
  }
  const dest = data.cliente_destinatario_id ? await getCliente(sb, data.cliente_destinatario_id) : null

  const valorProdutos = data.itens.reduce((s: number, i: any) => s + (i.quantidade || 0) * (i.valor_unitario || i.preco_unitario || 0), 0)
  const valorFrete = data.valor_frete || 0, valorSeguro = data.valor_seguro || 0, valorDesconto = data.valor_desconto || 0, outrasDespesas = data.outras_despesas || 0
  const valorTotal = valorProdutos + valorFrete + valorSeguro + outrasDespesas - valorDesconto
  const pesoTotal = data.itens.reduce((s: number, i: any) => s + (i.quantidade || 0), 0)

  let transp: any = null
  if (data.modalidade_frete === '0' && data.usar_transportadora_propria && emitente) {
    transp = { transportadora_nome: emitente.razao_social, transportadora_cnpj: emitente.cpf_cnpj, transportadora_ie: emitente.inscricao_estadual, transportadora_endereco: emitente.endereco_fiscal, transportadora_municipio: emitente.cidade_fiscal, transportadora_uf: emitente.estado_fiscal }
  } else if (data.transportadora_id) {
    const { data: t } = await sb.from('transportadoras').select('nome, cnpj').eq('id', data.transportadora_id).single()
    if (t) transp = { transportadora_nome: t.nome, transportadora_cnpj: t.cnpj }
  }

  const { itens, reserva_id, usar_transportadora_propria, ...rest } = data
  const saidaData = {
    user_id: userId, ...rest, cliente_origem_id: clienteOrigemId, peso_total: pesoTotal, peso_bruto: data.peso_bruto || pesoTotal, peso_liquido: data.peso_liquido || pesoTotal,
    status: 'separacao_pendente', status_aprovacao_produtor: userId === data.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    emitente_nome: emitente?.razao_social, emitente_nome_fantasia: emitente?.nome_fantasia, emitente_cnpj: emitente?.cpf_cnpj, emitente_ie: emitente?.inscricao_estadual,
    emitente_logradouro: emitente?.endereco_fiscal, emitente_numero: emitente?.numero_fiscal, emitente_complemento: emitente?.complemento_fiscal, emitente_bairro: emitente?.bairro_fiscal, emitente_municipio: emitente?.cidade_fiscal, emitente_uf: emitente?.estado_fiscal, emitente_cep: emitente?.cep_fiscal, emitente_telefone: emitente?.telefone_comercial, emitente_email: emitente?.email_comercial,
    destinatario_nome: dest?.razao_social, destinatario_cpf_cnpj: dest?.cpf_cnpj, destinatario_ie: dest?.inscricao_estadual, destinatario_logradouro: dest?.endereco_fiscal, destinatario_numero: dest?.numero_fiscal, destinatario_complemento: dest?.complemento_fiscal, destinatario_bairro: dest?.bairro_fiscal, destinatario_municipio: dest?.cidade_fiscal, destinatario_uf: dest?.estado_fiscal, destinatario_cep: dest?.cep_fiscal, destinatario_telefone: dest?.telefone_comercial, destinatario_email: dest?.email_comercial,
    ...transp, valor_produtos: valorProdutos, valor_frete: valorFrete, valor_seguro: valorSeguro, valor_desconto: valorDesconto, outras_despesas: outrasDespesas, valor_total: valorTotal, quantidade_volumes: data.quantidade_volumes || 0, numero_nfe: data.numero_nfe, serie_nfe: data.serie_nfe
  }

  const { data: saida, error } = await sb.from('saidas').insert(saidaData).select().single()
  if (error) throw error

  try {
    if (reserva_id) await sb.from('reservas_horario').update({ saida_id: saida.id }).eq('id', reserva_id)
    const shouldAlloc = data.movimenta_estoque !== 'nao_movimenta', isEntry = data.movimenta_estoque === 'entrada'
    const inserted = []
    for (const item of itens) {
      const { data: si, error: ie } = await sb.from('saida_itens').insert({ ...item, saida_id: saida.id, user_id: userId }).select().single()
      if (ie) throw ie
      if (shouldAlloc && !isEntry) {
        await sb.rpc('validar_e_alocar_estoque_fefo', { p_produto_id: item.produto_id, p_deposito_id: data.deposito_id, p_quantidade_necessaria: item.quantidade, p_saida_item_id: si.id })
        const { data: refs } = await sb.from('saida_item_referencias').select('lote, quantidade').eq('saida_item_id', si.id).order('created_at', { ascending: true })
        if (refs?.length) { const lote = refs.length === 1 ? refs[0].lote : 'MULTI'; await sb.from('saida_itens').update({ lote }).eq('id', si.id); si.lote = lote }
      }
      inserted.push(si)
    }
    await processFluxo(sb, userId, saida, data)
    return { ...saida, itens: inserted }
  } catch (e) { await sb.from('saidas').delete().eq('id', saida.id); throw e }
}

async function processFluxo(sb: any, userId: string, saida: any, data: any) {
  const destInterno = await detectDest(sb, data)
  if (!destInterno) return
  const clienteOrigemId = await findClienteOrigem(sb, userId, saida.deposito_id)
  if (!clienteOrigemId) { await criarEntrada(sb, saida, destInterno, null, data); return }
  const tipo = data.finalidade_nfe === 'transferencia' ? 'transferencia' : data.finalidade_nfe === 'remessa' ? 'remessa' : data.finalidade_nfe === 'devolucao' ? 'devolucao' : 'venda'
  const { data: fluxo } = await sb.from('documento_fluxo').insert({ saida_id: saida.id, cliente_origem_id: clienteOrigemId, cliente_destino_id: destInterno.id, tipo_fluxo: tipo, chave_nfe: data.chave_nfe, operador_deposito_id: destInterno.operador_logistico_id, transportadora_id: data.transportadora_id, status: 'pendente' }).select().single()
  await criarEntrada(sb, saida, destInterno, fluxo, data)
}

async function detectDest(sb: any, data: any) {
  if (data.cliente_destinatario_id) { const { data: c } = await sb.from('clientes').select('*, cliente_depositos(*)').eq('id', data.cliente_destinatario_id).eq('ativo', true).single(); if (c) return c }
  if (data.finalidade_nfe === 'transferencia' && data.destinatario_transferencia_id) { const { data: c } = await sb.from('clientes').select('*, cliente_depositos(*)').eq('id', data.destinatario_transferencia_id).single(); return c }
  let cpf = data.destinatario_cpf_cnpj || data.produtor_destinatario_cpf_cnpj
  if (!cpf && data.produtor_destinatario_id) { const { data: p } = await sb.from('profiles').select('cpf_cnpj').eq('user_id', data.produtor_destinatario_id).single(); cpf = p?.cpf_cnpj }
  if (!cpf) return null
  const clean = cpf.replace(/\D/g, '')
  const { data: c } = await sb.from('clientes').select('*, cliente_depositos(*)').or(`cpf_cnpj.eq.${clean},cpf_cnpj.eq.${cpf}`).eq('ativo', true).maybeSingle()
  return c
}

async function criarEntrada(sb: any, saida: any, dest: any, fluxo: any, data: any) {
  const { data: itens } = await sb.from('saida_itens').select('*, produtos(id, nome, codigo, unidade_medida)').eq('saida_id', saida.id)
  let orig = saida.cliente_origem_id ? await getCliente(sb, saida.cliente_origem_id) : null
  if (!orig && saida.deposito_id) { const { data: f } = await sb.from('franquias').select('*').eq('id', saida.deposito_id).single(); if (f) orig = { razao_social: f.razao_social || f.nome, nome_fantasia: f.nome, cpf_cnpj: f.cnpj, inscricao_estadual: f.inscricao_estadual, endereco_fiscal: f.endereco, numero_fiscal: f.numero, complemento_fiscal: f.complemento, bairro_fiscal: f.bairro, cidade_fiscal: f.cidade, estado_fiscal: f.estado, cep_fiscal: f.cep, telefone_comercial: f.telefone } }
  const valorProd = itens?.reduce((s: number, i: any) => s + (i.quantidade || 0) * (i.valor_unitario || 0), 0) || 0
  const qtdVol = itens?.reduce((s: number, i: any) => s + (i.quantidade || 0), 0) || 0
  let depId = dest.operador_logistico_id; if (!depId && dest.cliente_depositos?.length) depId = dest.cliente_depositos.find((d: any) => d.ativo !== false)?.franquia_id
  const { data: u } = await sb.from('cliente_usuarios').select('user_id').eq('cliente_id', dest.id).eq('ativo', true).limit(1).single()
  const uid = u?.user_id || saida.user_id
  const nat = data.finalidade_nfe === 'transferencia' ? 'Transferência' : data.finalidade_nfe === 'remessa' ? 'Remessa' : data.finalidade_nfe === 'devolucao' ? 'Devolução' : 'Compra'
  const { data: ent, error } = await sb.from('entradas').insert({
    user_id: uid, deposito_id: depId, cliente_id: dest.id, data_entrada: new Date().toISOString().split('T')[0], numero_nfe: saida.numero_nfe || `INT-${saida.id.substring(0, 8)}`, chave_nfe: saida.chave_nfe, serie: saida.serie_nfe,
    emitente_nome: orig?.razao_social || 'Fornecedor', emitente_nome_fantasia: orig?.nome_fantasia, emitente_cnpj: orig?.cpf_cnpj || '', emitente_ie: orig?.inscricao_estadual, emitente_logradouro: orig?.endereco_fiscal, emitente_numero: orig?.numero_fiscal, emitente_complemento: orig?.complemento_fiscal, emitente_bairro: orig?.bairro_fiscal, emitente_municipio: orig?.cidade_fiscal, emitente_uf: orig?.estado_fiscal, emitente_cep: orig?.cep_fiscal, emitente_telefone: orig?.telefone_comercial,
    destinatario_nome: dest.razao_social, destinatario_cpf_cnpj: dest.cpf_cnpj, destinatario_ie: dest.inscricao_estadual, destinatario_logradouro: dest.endereco_fiscal, destinatario_numero: dest.numero_fiscal, destinatario_complemento: dest.complemento_fiscal, destinatario_bairro: dest.bairro_fiscal, destinatario_municipio: dest.cidade_fiscal, destinatario_uf: dest.estado_fiscal, destinatario_cep: dest.cep_fiscal, destinatario_telefone: dest.telefone_comercial,
    peso_bruto: saida.peso_total, peso_liquido: saida.peso_total, valor_total: saida.valor_total || valorProd, valor_produtos: saida.valor_produtos || valorProd, valor_frete: saida.valor_frete, valor_seguro: saida.valor_seguro, quantidade_volumes: qtdVol,
    status_aprovacao: 'pendente_aprovacao', tipo_recebimento: 'edi_interno', saida_origem_id: saida.id, documento_fluxo_id: fluxo?.id, natureza_operacao: nat, observacoes: `EDI - Saída: ${saida.id}`
  }).select().single()
  if (error) throw error
  if (itens?.length) await sb.from('entrada_itens').insert(itens.map((i: any) => ({ entrada_id: ent.id, user_id: uid, produto_id: i.produto_id, nome_produto: i.produtos?.nome || 'Produto', codigo_produto: i.produtos?.codigo, unidade_comercial: i.produtos?.unidade_medida || 'UN', quantidade: i.quantidade, valor_unitario: i.valor_unitario || 0, lote: i.lote, valor_total: (i.quantidade || 0) * (i.valor_unitario || 0) })))
  if (fluxo?.id) await sb.from('documento_fluxo').update({ entrada_id: ent.id }).eq('id', fluxo.id)
  await sb.from('saidas').update({ entrada_gerada_id: ent.id }).eq('id', saida.id)
  return ent
}

async function updateSaida(sb: any, userId: string, data: any) {
  const { id, ...upd } = data
  const { data: s, error } = await sb.from('saidas').update({ ...upd, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error; return s
}

async function deleteSaida(sb: any, userId: string, id: string) {
  const { error } = await sb.from('saidas').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error; return { id }
}

async function updateStatus(sb: any, data: any) {
  const { id, status, observacoes } = data
  const { data: s, error } = await sb.from('saidas').update({ status, observacoes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error; return s
}

async function approveSaida(sb: any, data: any) {
  const { id, status_aprovacao, observacoes } = data
  const upd: any = { status_aprovacao_produtor: status_aprovacao, updated_at: new Date().toISOString() }
  if (observacoes) upd.observacoes = observacoes
  if (status_aprovacao === 'aprovado') upd.data_aprovacao_produtor = new Date().toISOString()
  const { data: s, error } = await sb.from('saidas').update(upd).eq('id', id).select().single()
  if (error) throw error; return s
}

async function allocateViagem(sb: any, data: any) {
  const { viagemId, saidaId } = data
  const { data: s, error } = await sb.from('saidas').update({ viagem_id: viagemId, status: 'alocado_viagem', updated_at: new Date().toISOString() }).eq('id', saidaId).select().single()
  if (error) throw error
  await sb.from('entradas').update({ viagem_id: viagemId }).eq('saida_origem_id', saidaId)
  return s
}

async function deallocateViagem(sb: any, saidaId: string) {
  const { data: s, error } = await sb.from('saidas').update({ viagem_id: null, status: 'expedido', updated_at: new Date().toISOString() }).eq('id', saidaId).select().single()
  if (error) throw error; return s
}

async function createDevolucao(sb: any, userId: string, data: any) {
  const { ocorrencia_id, saida_id, tipo_devolucao, itens_devolvidos, observacoes } = data
  const { data: saida, error: se } = await sb.from('saidas').select('*, deposito:franquias!deposito_id(id, nome, master_franqueado_id), produtor_destinatario:profiles!produtor_destinatario_id(id, nome, cpf_cnpj), saida_itens(id, produto_id, quantidade, valor_unitario, lote, produtos(id, nome, codigo, unidade_medida))').eq('id', saida_id).single()
  if (se || !saida) throw new Error('Saída não encontrada')
  if (!['expedido', 'entregue'].includes(saida.status)) throw new Error('Status inválido para devolução')
  const { data: ent, error: ee } = await sb.from('entradas').insert({ user_id: saida.user_id, deposito_id: saida.deposito_id, data_entrada: new Date().toISOString(), tipo_entrada: 'devolucao', numero_nfe: `DEV-${saida.id.substring(0, 8)}`, emitente_cnpj: saida.produtor_destinatario?.cpf_cnpj || '', emitente_nome: saida.produtor_destinatario?.nome || 'Cliente', destinatario_cpf_cnpj: saida.deposito?.master_franqueado_id || '', destinatario_nome: saida.deposito?.nome || 'Depósito', observacoes: observacoes || `Devolução ${tipo_devolucao} - Saída: ${saida.id}`, status_aprovacao: 'aguardando_conferencia', saida_origem_id: saida_id }).select().single()
  if (ee) throw ee
  const itensEnt = tipo_devolucao === 'total' ? saida.saida_itens.map((i: any) => ({ entrada_id: ent.id, user_id: saida.user_id, produto_id: i.produto_id, nome_produto: i.produtos.nome, codigo_produto: i.produtos.codigo, unidade_comercial: i.produtos.unidade_medida, quantidade: i.quantidade, valor_unitario: i.valor_unitario, lote: i.lote, valor_total: i.quantidade * i.valor_unitario }))
    : itens_devolvidos.map((d: any) => { const o = saida.saida_itens.find((x: any) => x.id === d.saida_item_id); if (!o) throw new Error('Item não encontrado'); return { entrada_id: ent.id, user_id: saida.user_id, produto_id: o.produto_id, nome_produto: o.produtos.nome, codigo_produto: o.produtos.codigo, unidade_comercial: o.produtos.unidade_medida, quantidade: d.quantidade, valor_unitario: o.valor_unitario, lote: o.lote, valor_total: d.quantidade * o.valor_unitario } })
  const { error: ie } = await sb.from('entrada_itens').insert(itensEnt)
  if (ie) { await sb.from('entradas').delete().eq('id', ent.id); throw ie }
  await sb.from('saidas').update({ status: tipo_devolucao === 'total' ? 'em_devolucao' : saida.status }).eq('id', saida_id)
  await sb.from('ocorrencias').update({ requer_devolucao: true, devolucao_id: ent.id, quantidade_devolvida: { tipo: tipo_devolucao, itens: itensEnt.length } }).eq('id', ocorrencia_id)
  return { entrada_id: ent.id, saida_id, tipo_devolucao, itens_count: itensEnt.length }
}
