import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const auth = req.headers.get('Authorization')
    if (!auth) throw new Error('No auth')
    const { data: { user }, error: ae } = await sb.auth.getUser(auth.replace('Bearer ', ''))
    if (ae || !user) throw new Error('Auth failed')

    const { action, data } = await req.json()
    let r
    if (action === 'create') r = await create(sb, user.id, data)
    else if (action === 'update') r = await update(sb, user.id, data)
    else if (action === 'delete') r = await del(sb, user.id, data.id)
    else if (action === 'update_status') r = await status(sb, data)
    else if (action === 'approve') r = await approve(sb, data)
    else if (action === 'allocate_viagem') r = await allocV(sb, data)
    else if (action === 'deallocate_viagem') r = await deallocV(sb, data.saidaId)
    else if (action === 'create_devolucao') r = await devol(sb, user.id, data)
    else throw new Error('Invalid action')
    return new Response(JSON.stringify({ success: true, data: r }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function getCli(sb: any, id: string) {
  const { data } = await sb.from('clientes').select('id,razao_social,nome_fantasia,cpf_cnpj,inscricao_estadual,endereco_fiscal,numero_fiscal,complemento_fiscal,bairro_fiscal,cidade_fiscal,estado_fiscal,cep_fiscal,telefone_comercial,email_comercial').eq('id', id).single()
  return data
}

async function findOrig(sb: any, uid: string, depId?: string) {
  const { data: cu } = await sb.from('cliente_usuarios').select('cliente_id').eq('user_id', uid).eq('ativo', true).limit(1).maybeSingle()
  if (cu?.cliente_id) return cu.cliente_id
  if (!depId) return null
  const { data: f } = await sb.from('franquias').select('cnpj').eq('id', depId).single()
  if (f?.cnpj) {
    const c = f.cnpj.replace(/\D/g, '')
    const { data: cl } = await sb.from('clientes').select('id').or(`cpf_cnpj.eq.${c},cpf_cnpj.eq.${f.cnpj}`).eq('ativo', true).limit(1).maybeSingle()
    if (cl?.id) return cl.id
  }
  return null
}

async function create(sb: any, uid: string, d: any) {
  if (!d.data_saida || !d.itens?.length || !d.deposito_id) throw new Error('Missing fields')
  const origId = d.cliente_origem_id || await findOrig(sb, uid, d.deposito_id)
  let em = origId ? await getCli(sb, origId) : null
  if (!em && d.deposito_id) {
    const { data: f } = await sb.from('franquias').select('*').eq('id', d.deposito_id).single()
    if (f) em = { razao_social: f.razao_social||f.nome, nome_fantasia: f.nome, cpf_cnpj: f.cnpj, inscricao_estadual: f.inscricao_estadual, endereco_fiscal: f.endereco, numero_fiscal: f.numero, complemento_fiscal: f.complemento, bairro_fiscal: f.bairro, cidade_fiscal: f.cidade, estado_fiscal: f.estado, cep_fiscal: f.cep, telefone_comercial: f.telefone, email_comercial: f.email }
  }
  const dest = d.cliente_destinatario_id ? await getCli(sb, d.cliente_destinatario_id) : null
  const vp = d.itens.reduce((s: number, i: any) => s + (i.quantidade||0) * (i.valor_unitario||i.preco_unitario||0), 0)
  const vf = d.valor_frete||0, vs = d.valor_seguro||0, vd = d.valor_desconto||0, od = d.outras_despesas||0
  const vt = vp + vf + vs + od - vd
  const pt = d.itens.reduce((s: number, i: any) => s + (i.quantidade||0), 0)
  let tr: any = null
  if (d.modalidade_frete === '0' && d.usar_transportadora_propria && em) tr = { transportadora_nome: em.razao_social, transportadora_cnpj: em.cpf_cnpj, transportadora_ie: em.inscricao_estadual, transportadora_endereco: em.endereco_fiscal, transportadora_municipio: em.cidade_fiscal, transportadora_uf: em.estado_fiscal }
  else if (d.transportadora_id) { const { data: t } = await sb.from('transportadoras').select('nome,cnpj').eq('id', d.transportadora_id).single(); if (t) tr = { transportadora_nome: t.nome, transportadora_cnpj: t.cnpj } }
  const { itens, reserva_id, usar_transportadora_propria, ...rest } = d
  const sd = { user_id: uid, ...rest, cliente_origem_id: origId, peso_total: pt, peso_bruto: d.peso_bruto||pt, peso_liquido: d.peso_liquido||pt, status: 'separacao_pendente', status_aprovacao_produtor: uid === d.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    emitente_nome: em?.razao_social, emitente_nome_fantasia: em?.nome_fantasia, emitente_cnpj: em?.cpf_cnpj, emitente_ie: em?.inscricao_estadual, emitente_logradouro: em?.endereco_fiscal, emitente_numero: em?.numero_fiscal, emitente_complemento: em?.complemento_fiscal, emitente_bairro: em?.bairro_fiscal, emitente_municipio: em?.cidade_fiscal, emitente_uf: em?.estado_fiscal, emitente_cep: em?.cep_fiscal, emitente_telefone: em?.telefone_comercial, emitente_email: em?.email_comercial,
    destinatario_nome: dest?.razao_social, destinatario_cpf_cnpj: dest?.cpf_cnpj, destinatario_ie: dest?.inscricao_estadual, destinatario_logradouro: dest?.endereco_fiscal, destinatario_numero: dest?.numero_fiscal, destinatario_complemento: dest?.complemento_fiscal, destinatario_bairro: dest?.bairro_fiscal, destinatario_municipio: dest?.cidade_fiscal, destinatario_uf: dest?.estado_fiscal, destinatario_cep: dest?.cep_fiscal, destinatario_telefone: dest?.telefone_comercial, destinatario_email: dest?.email_comercial,
    ...tr, valor_produtos: vp, valor_frete: vf, valor_seguro: vs, valor_desconto: vd, outras_despesas: od, valor_total: vt, quantidade_volumes: d.quantidade_volumes||0, numero_nfe: d.numero_nfe, serie_nfe: d.serie_nfe }
  const { data: s, error } = await sb.from('saidas').insert(sd).select().single()
  if (error) throw error
  try {
    if (reserva_id) await sb.from('reservas_horario').update({ saida_id: s.id }).eq('id', reserva_id)
    const alloc = d.movimenta_estoque !== 'nao_movimenta', isE = d.movimenta_estoque === 'entrada'
    const ins = []
    for (const it of itens) {
      const { data: si, error: ie } = await sb.from('saida_itens').insert({ ...it, saida_id: s.id, user_id: uid }).select().single()
      if (ie) throw ie
      if (alloc && !isE) {
        await sb.rpc('validar_e_alocar_estoque_fefo', { p_produto_id: it.produto_id, p_deposito_id: d.deposito_id, p_quantidade_necessaria: it.quantidade, p_saida_item_id: si.id })
        const { data: rf } = await sb.from('saida_item_referencias').select('lote,quantidade').eq('saida_item_id', si.id).order('created_at', { ascending: true })
        if (rf?.length) { const l = rf.length === 1 ? rf[0].lote : 'MULTI'; await sb.from('saida_itens').update({ lote: l }).eq('id', si.id); si.lote = l }
      }
      ins.push(si)
    }
    await fluxo(sb, uid, s, d)
    return { ...s, itens: ins }
  } catch (e) { await sb.from('saidas').delete().eq('id', s.id); throw e }
}

async function fluxo(sb: any, uid: string, s: any, d: any) {
  const di = await detDest(sb, d)
  if (!di) return
  const oid = await findOrig(sb, uid, s.deposito_id)
  if (!oid) { await mkEnt(sb, s, di, null, d); return }
  const t = d.finalidade_nfe === 'transferencia' ? 'transferencia' : d.finalidade_nfe === 'remessa' ? 'remessa' : d.finalidade_nfe === 'devolucao' ? 'devolucao' : 'venda'
  const { data: fl } = await sb.from('documento_fluxo').insert({ saida_id: s.id, cliente_origem_id: oid, cliente_destino_id: di.id, tipo_fluxo: t, chave_nfe: d.chave_nfe, operador_deposito_id: di.operador_logistico_id, transportadora_id: d.transportadora_id, status: 'pendente' }).select().single()
  await mkEnt(sb, s, di, fl, d)
}

async function detDest(sb: any, d: any) {
  if (d.cliente_destinatario_id) { const { data: c } = await sb.from('clientes').select('*,cliente_depositos(*)').eq('id', d.cliente_destinatario_id).eq('ativo', true).single(); if (c) return c }
  if (d.finalidade_nfe === 'transferencia' && d.destinatario_transferencia_id) { const { data: c } = await sb.from('clientes').select('*,cliente_depositos(*)').eq('id', d.destinatario_transferencia_id).single(); return c }
  let cp = d.destinatario_cpf_cnpj || d.produtor_destinatario_cpf_cnpj
  if (!cp && d.produtor_destinatario_id) { const { data: p } = await sb.from('profiles').select('cpf_cnpj').eq('user_id', d.produtor_destinatario_id).single(); cp = p?.cpf_cnpj }
  if (!cp) return null
  const cl = cp.replace(/\D/g, '')
  const { data: c } = await sb.from('clientes').select('*,cliente_depositos(*)').or(`cpf_cnpj.eq.${cl},cpf_cnpj.eq.${cp}`).eq('ativo', true).maybeSingle()
  return c
}

async function mkEnt(sb: any, s: any, dt: any, fl: any, d: any) {
  const { data: its } = await sb.from('saida_itens').select('*,produtos(id,nome,codigo,unidade_medida)').eq('saida_id', s.id)
  let og = s.cliente_origem_id ? await getCli(sb, s.cliente_origem_id) : null
  if (!og && s.deposito_id) { const { data: f } = await sb.from('franquias').select('*').eq('id', s.deposito_id).single(); if (f) og = { razao_social: f.razao_social||f.nome, nome_fantasia: f.nome, cpf_cnpj: f.cnpj, inscricao_estadual: f.inscricao_estadual, endereco_fiscal: f.endereco, numero_fiscal: f.numero, complemento_fiscal: f.complemento, bairro_fiscal: f.bairro, cidade_fiscal: f.cidade, estado_fiscal: f.estado, cep_fiscal: f.cep, telefone_comercial: f.telefone } }
  const vp = its?.reduce((x: number, i: any) => x + (i.quantidade||0) * (i.valor_unitario||0), 0) || 0
  const qv = its?.reduce((x: number, i: any) => x + (i.quantidade||0), 0) || 0
  let dp = dt.operador_logistico_id; if (!dp && dt.cliente_depositos?.length) dp = dt.cliente_depositos.find((x: any) => x.ativo !== false)?.franquia_id
  const { data: u } = await sb.from('cliente_usuarios').select('user_id').eq('cliente_id', dt.id).eq('ativo', true).limit(1).single()
  const ui = u?.user_id || s.user_id
  const nt = d.finalidade_nfe === 'transferencia' ? 'Transferência' : d.finalidade_nfe === 'remessa' ? 'Remessa' : d.finalidade_nfe === 'devolucao' ? 'Devolução' : 'Compra'
  const entradaData = {
    user_id: ui, deposito_id: dp, cliente_id: dt.id, data_entrada: new Date().toISOString().split('T')[0], 
    numero_nfe: s.numero_nfe || `INT-${s.id.substring(0, 8)}`, chave_nfe: s.chave_nfe || null, serie: s.serie_nfe || null,
    emitente_nome: og?.razao_social || 'Fornecedor', emitente_nome_fantasia: og?.nome_fantasia || null, 
    emitente_cnpj: og?.cpf_cnpj || '', emitente_ie: og?.inscricao_estadual || null, 
    emitente_logradouro: og?.endereco_fiscal || null, emitente_numero: og?.numero_fiscal || null, 
    emitente_complemento: og?.complemento_fiscal || null, emitente_bairro: og?.bairro_fiscal || null, 
    emitente_municipio: og?.cidade_fiscal || null, emitente_uf: og?.estado_fiscal || null, 
    emitente_cep: og?.cep_fiscal || null, emitente_telefone: og?.telefone_comercial || null,
    destinatario_nome: dt.razao_social || null, destinatario_cpf_cnpj: dt.cpf_cnpj || null, 
    destinatario_ie: dt.inscricao_estadual || null, destinatario_logradouro: dt.endereco_fiscal || null, 
    destinatario_numero: dt.numero_fiscal || null, destinatario_complemento: dt.complemento_fiscal || null, 
    destinatario_bairro: dt.bairro_fiscal || null, destinatario_municipio: dt.cidade_fiscal || null, 
    destinatario_uf: dt.estado_fiscal || null, destinatario_cep: dt.cep_fiscal || null, 
    destinatario_telefone: dt.telefone_comercial || null,
    peso_bruto: s.peso_total || 0, peso_liquido: s.peso_total || 0, 
    valor_total: s.valor_total || vp, valor_produtos: s.valor_produtos || vp, 
    valor_frete: s.valor_frete || 0, valor_seguro: s.valor_seguro || 0, quantidade_volumes: qv,
    status_aprovacao: 'pendente_aprovacao', tipo_recebimento: 'edi_interno', 
    saida_origem_id: s.id, documento_fluxo_id: fl?.id || null, natureza_operacao: nt, 
    observacoes: `EDI - Saída: ${s.id}`
  }
  const { data: en, error } = await sb.from('entradas').insert(entradaData).select().single()
  if (error) throw error
  if (its?.length) await sb.from('entrada_itens').insert(its.map((i: any) => ({ entrada_id: en.id, user_id: ui, produto_id: i.produto_id, nome_produto: i.produtos?.nome || 'Produto', codigo_produto: i.produtos?.codigo, unidade_comercial: i.produtos?.unidade_medida || 'UN', quantidade: i.quantidade, valor_unitario: i.valor_unitario || 0, lote: i.lote, valor_total: (i.quantidade||0) * (i.valor_unitario||0) })))
  if (fl?.id) await sb.from('documento_fluxo').update({ entrada_id: en.id }).eq('id', fl.id)
  await sb.from('saidas').update({ entrada_gerada_id: en.id }).eq('id', s.id)
  return en
}

async function update(sb: any, uid: string, d: any) { const { id, ...u } = d; const { data: s, error } = await sb.from('saidas').update({ ...u, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid).select().single(); if (error) throw error; return s }
async function del(sb: any, uid: string, id: string) { const { error } = await sb.from('saidas').delete().eq('id', id).eq('user_id', uid); if (error) throw error; return { id } }
async function status(sb: any, d: any) { const { id, status, observacoes } = d; const { data: s, error } = await sb.from('saidas').update({ status, observacoes, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return s }
async function approve(sb: any, d: any) { const { id, status_aprovacao, observacoes } = d; const u: any = { status_aprovacao_produtor: status_aprovacao, updated_at: new Date().toISOString() }; if (observacoes) u.observacoes = observacoes; if (status_aprovacao === 'aprovado') u.data_aprovacao_produtor = new Date().toISOString(); const { data: s, error } = await sb.from('saidas').update(u).eq('id', id).select().single(); if (error) throw error; return s }
async function allocV(sb: any, d: any) { const { viagemId, saidaId } = d; const { data: s, error } = await sb.from('saidas').update({ viagem_id: viagemId, status: 'alocado_viagem', updated_at: new Date().toISOString() }).eq('id', saidaId).select().single(); if (error) throw error; await sb.from('entradas').update({ viagem_id: viagemId }).eq('saida_origem_id', saidaId); return s }
async function deallocV(sb: any, id: string) { const { data: s, error } = await sb.from('saidas').update({ viagem_id: null, status: 'expedido', updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return s }
async function devol(sb: any, uid: string, d: any) {
  const { ocorrencia_id, saida_id, tipo_devolucao, itens_devolvidos, observacoes } = d
  const { data: sa, error: se } = await sb.from('saidas').select('*,deposito:franquias!deposito_id(id,nome,master_franqueado_id),produtor_destinatario:profiles!produtor_destinatario_id(id,nome,cpf_cnpj),saida_itens(id,produto_id,quantidade,valor_unitario,lote,produtos(id,nome,codigo,unidade_medida))').eq('id', saida_id).single()
  if (se || !sa) throw new Error('Saída não encontrada')
  if (!['expedido', 'entregue'].includes(sa.status)) throw new Error('Status inválido')
  const { data: en, error: ee } = await sb.from('entradas').insert({ user_id: sa.user_id, deposito_id: sa.deposito_id, data_entrada: new Date().toISOString(), tipo_entrada: 'devolucao', numero_nfe: `DEV-${sa.id.substring(0, 8)}`, emitente_cnpj: sa.produtor_destinatario?.cpf_cnpj || '', emitente_nome: sa.produtor_destinatario?.nome || 'Cliente', destinatario_cpf_cnpj: sa.deposito?.master_franqueado_id || '', destinatario_nome: sa.deposito?.nome || 'Depósito', observacoes: observacoes || `Devolução ${tipo_devolucao}`, status_aprovacao: 'aguardando_conferencia', saida_origem_id: saida_id }).select().single()
  if (ee) throw ee
  const ie = tipo_devolucao === 'total' ? sa.saida_itens.map((i: any) => ({ entrada_id: en.id, user_id: sa.user_id, produto_id: i.produto_id, nome_produto: i.produtos.nome, codigo_produto: i.produtos.codigo, unidade_comercial: i.produtos.unidade_medida, quantidade: i.quantidade, valor_unitario: i.valor_unitario, lote: i.lote, valor_total: i.quantidade * i.valor_unitario }))
    : itens_devolvidos.map((x: any) => { const o = sa.saida_itens.find((y: any) => y.id === x.saida_item_id); if (!o) throw new Error('Item não encontrado'); return { entrada_id: en.id, user_id: sa.user_id, produto_id: o.produto_id, nome_produto: o.produtos.nome, codigo_produto: o.produtos.codigo, unidade_comercial: o.produtos.unidade_medida, quantidade: x.quantidade, valor_unitario: o.valor_unitario, lote: o.lote, valor_total: x.quantidade * o.valor_unitario } })
  const { error: ir } = await sb.from('entrada_itens').insert(ie)
  if (ir) { await sb.from('entradas').delete().eq('id', en.id); throw ir }
  await sb.from('saidas').update({ status: tipo_devolucao === 'total' ? 'em_devolucao' : sa.status }).eq('id', saida_id)
  await sb.from('ocorrencias').update({ requer_devolucao: true, devolucao_id: en.id, quantidade_devolvida: { tipo: tipo_devolucao, itens: ie.length } }).eq('id', ocorrencia_id)
  return { entrada_id: en.id, saida_id, tipo_devolucao, itens_count: ie.length }
}
