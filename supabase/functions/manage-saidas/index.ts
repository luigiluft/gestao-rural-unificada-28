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
        result = await createSaida(supabaseClient, user.id, data)
        break
      case 'update':
        result = await updateSaida(supabaseClient, user.id, data)
        break
      case 'delete':
        result = await deleteSaida(supabaseClient, user.id, data.id)
        break
      case 'update_status':
        result = await updateSaidaStatus(supabaseClient, user.id, data)
        break
      case 'approve':
        result = await approveSaida(supabaseClient, user.id, data)
        break
      case 'allocate_viagem':
        result = await allocateToViagem(supabaseClient, user.id, data)
        break
      case 'deallocate_viagem':
        result = await deallocateFromViagem(supabaseClient, user.id, data.saidaId)
        break
      case 'create_devolucao':
        result = await createDevolucao(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
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

async function createSaida(supabase: any, userId: string, data: any) {
  console.log('📦 Creating saida with data:', JSON.stringify(data, null, 2))
  
  if (!data.data_saida || !data.itens || data.itens.length === 0) {
    throw new Error('Missing required fields')
  }

  // Validate deposito_id for FEFO traceability
  if (!data.deposito_id) {
    throw new Error('deposito_id é obrigatório para rastreabilidade FEFO')
  }

  // Log delivery window fields specifically
  console.log('🗓️ Delivery window fields:', {
    data_inicio_janela: data.data_inicio_janela,
    data_fim_janela: data.data_fim_janela,
    janela_entrega_dias: data.janela_entrega_dias
  })

  // Log fiscal operation fields
  console.log('📋 Fiscal operation fields:', {
    finalidade_nfe: data.finalidade_nfe,
    nfe_referenciada_chave: data.nfe_referenciada_chave,
    cfop: data.cfop,
    gera_financeiro: data.gera_financeiro,
    movimenta_estoque: data.movimenta_estoque,
    tipo_complemento: data.tipo_complemento
  })

  // Calculate total weight
  const pesoTotal = data.itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)

  // Create saida data excluding itens and reserva_id
  const { itens, reserva_id, ...saidaFields } = data
  const saidaData = {
    user_id: userId,
    ...saidaFields,
    peso_total: pesoTotal,
    status: 'separacao_pendente',
    status_aprovacao_produtor: userId === data.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: saida, error: saidaError } = await supabase
    .from('saidas')
    .insert(saidaData)
    .select()
    .single()

  if (saidaError) throw saidaError

  try {
    // Update reservation if provided
    if (reserva_id) {
      const { error: reservaError } = await supabase
        .from('reservas_horario')
        .update({ saida_id: saida.id })
        .eq('id', reserva_id)
      
      if (reservaError) {
        console.error('Error updating reservation:', reservaError)
        // Don't fail the entire operation for reservation update error
      }
    }

    // Determine if stock should be allocated based on finalidade_nfe
    const shouldAllocateStock = data.movimenta_estoque !== 'nao_movimenta'
    const isStockEntry = data.movimenta_estoque === 'entrada' // For devolução

    // Insert items with FEFO allocation (unless movimenta_estoque is 'nao_movimenta')
    const itensInseridos = []
    
    for (const item of data.itens) {
      // Insert saida_item
      const { data: saidaItem, error: itemError } = await supabase
        .from('saida_itens')
        .insert({
          ...item,
          saida_id: saida.id,
          user_id: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (itemError) {
        throw new Error(`Erro ao criar item: ${itemError.message}`)
      }

      // Only allocate stock if not 'nao_movimenta' (complementar)
      if (shouldAllocateStock) {
        if (isStockEntry) {
          // For devolução: This would typically create stock entry, not allocation
          // For now, we log and skip FEFO allocation since it's an entry operation
          console.log(`📥 Devolução: skipping FEFO allocation for product ${item.produto_id} - stock entry will be handled separately`)
        } else {
          // Normal stock exit - use FEFO allocation
          console.log(`Calling FEFO allocation for product ${item.produto_id}, quantity: ${item.quantidade}`)
          const { data: alocacaoResult, error: alocacaoError } = await supabase
            .rpc('validar_e_alocar_estoque_fefo', {
              p_produto_id: item.produto_id,
              p_deposito_id: data.deposito_id,
              p_quantidade_necessaria: item.quantidade,
              p_saida_item_id: saidaItem.id
            })

          if (alocacaoError) {
            throw new Error(`Erro ao alocar estoque FEFO: ${alocacaoError.message}`)
          }

          console.log(`FEFO allocation result for product ${item.produto_id}:`, alocacaoResult)
          
          // Buscar os lotes das referências criadas pela alocação FEFO
          const { data: referencias, error: referenciasError } = await supabase
            .from('saida_item_referencias')
            .select('lote, quantidade')
            .eq('saida_item_id', saidaItem.id)
            .order('created_at', { ascending: true })
          
          if (referenciasError) {
            console.error('Error fetching saida_item_referencias:', referenciasError)
          }
          
          // Atualizar o saida_item com o lote apropriado
          let loteToUpdate = null
          if (referencias && referencias.length > 0) {
            if (referencias.length === 1) {
              loteToUpdate = referencias[0].lote
              console.log(`Single batch allocation - updating saida_item ${saidaItem.id} with lote: ${loteToUpdate}`)
            } else {
              loteToUpdate = 'MULTI'
              console.log(`Multiple batch allocation (${referencias.length} batches) - updating saida_item ${saidaItem.id} with lote: MULTI`)
              console.log('Allocated batches:', referencias.map(r => `${r.lote} (${r.quantidade})`).join(', '))
            }
            
            const { error: updateError } = await supabase
              .from('saida_itens')
              .update({ lote: loteToUpdate })
              .eq('id', saidaItem.id)
            
            if (updateError) {
              console.error('Error updating saida_item lote:', updateError)
            } else {
              saidaItem.lote = loteToUpdate
              console.log(`Successfully updated saida_item ${saidaItem.id} with lote: ${loteToUpdate}`)
            }
          } else {
            console.warn(`No allocation references found for saida_item ${saidaItem.id}`)
          }
        }
      } else {
        console.log(`📋 Complementar: skipping stock allocation for product ${item.produto_id}`)
      }
      
      itensInseridos.push(saidaItem)
    }

    // Generate CT-e if tipo_saida is 'entrega_fazenda'
    let cte = null
    if (data.tipo_saida === 'entrega_fazenda') {
      console.log('🚚 Creating CT-e for entrega_fazenda saida:', saida.id)
      try {
        cte = await generateCTe(supabase, userId, saida, data)
        console.log('✅ CT-e created successfully:', cte?.id)
      } catch (cteError) {
        console.error('❌ Error creating CT-e:', cteError)
        // Don't fail the saida creation if CT-e fails, but log it
      }
    }

    // 🔗 INTEGRAÇÃO NATIVA: Detectar se destinatário está cadastrado no sistema
    let documentoFluxo = null
    try {
      documentoFluxo = await processarFluxoDocumentoInterno(supabase, userId, saida, data)
      if (documentoFluxo) {
        console.log('✅ Fluxo de documento interno criado:', documentoFluxo.id)
      }
    } catch (fluxoError) {
      console.error('⚠️ Erro ao processar fluxo interno (não crítico):', fluxoError)
      // Don't fail the saida creation if flow processing fails
    }

    return { ...saida, itens: itensInseridos, cte, documento_fluxo: documentoFluxo }
  } catch (error) {
    // If any error occurs after saida creation, clean up
    console.error('Error creating saida, rolling back:', error)
    await supabase.from('saidas').delete().eq('id', saida.id)
    throw error
  }
}

async function generateCTe(supabase: any, userId: string, saida: any, saidaData: any) {
  console.log('📋 Generating CT-e for saida:', saida.id)
  
  // Get franchise/deposito details (emitente e remetente)
  const { data: franquia, error: franquiaError } = await supabase
    .from('franquias')
    .select('*')
    .eq('id', saida.deposito_id)
    .single()
  
  if (franquiaError || !franquia) {
    throw new Error('Franquia não encontrada para gerar CT-e')
  }
  
  // Get farm details (destinatario)
  const { data: fazenda, error: fazendaError } = await supabase
    .from('fazendas')
    .select('*')
    .eq('id', saida.fazenda_id)
    .single()
  
  if (fazendaError || !fazenda) {
    throw new Error('Fazenda não encontrada para gerar CT-e')
  }
  
  // Get producer details (tomador)
  const { data: produtor, error: produtorError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', saida.produtor_destinatario_id)
    .single()
  
  if (produtorError || !produtor) {
    throw new Error('Produtor não encontrado para gerar CT-e')
  }
  
  // Generate sequential CT-e number
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const { data: lastCte } = await supabase
    .from('ctes')
    .select('numero_cte')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  let nextNumber = 1
  if (lastCte?.numero_cte) {
    const lastNumber = parseInt(lastCte.numero_cte.split('-')[1] || '0')
    nextNumber = lastNumber + 1
  }
  
  const numeroCte = `CTE-${String(nextNumber).padStart(8, '0')}`
  
  // Prepare CT-e data
  const cteData = {
    saida_id: saida.id,
    numero_cte: numeroCte,
    serie: '1',
    modelo: '57',
    data_emissao: new Date().toISOString(),
    tipo_ambiente: 'homologacao',
    tipo_cte: 'normal',
    cfop: '5353', // Prestação de serviço de transporte
    natureza_operacao: 'Prestação de serviço de transporte',
    modal: '01', // Rodoviário
    tipo_servico: '0', // Normal
    
    // Localização
    municipio_envio_codigo: franquia.codigo_municipio,
    municipio_envio_nome: franquia.cidade,
    municipio_envio_uf: franquia.estado,
    municipio_inicio_codigo: franquia.codigo_municipio,
    municipio_inicio_nome: franquia.cidade,
    municipio_inicio_uf: franquia.estado,
    municipio_fim_codigo: fazenda.codigo_municipio,
    municipio_fim_nome: fazenda.cidade,
    municipio_fim_uf: fazenda.estado,
    
    // Emitente (Franquia)
    emitente_cnpj: franquia.cnpj,
    emitente_ie: franquia.inscricao_estadual,
    emitente_nome: franquia.razao_social || franquia.nome,
    emitente_fantasia: franquia.nome,
    emitente_endereco: {
      logradouro: franquia.endereco,
      numero: franquia.numero,
      bairro: franquia.bairro,
      municipio: franquia.cidade,
      uf: franquia.estado,
      cep: franquia.cep,
      fone: franquia.telefone
    },
    
    // Remetente (Depósito/Franquia)
    remetente_cnpj: franquia.cnpj,
    remetente_ie: franquia.inscricao_estadual,
    remetente_nome: franquia.razao_social || franquia.nome,
    remetente_fantasia: franquia.nome,
    remetente_fone: franquia.telefone,
    remetente_endereco: {
      logradouro: franquia.endereco,
      numero: franquia.numero,
      bairro: franquia.bairro,
      municipio: franquia.cidade,
      uf: franquia.estado,
      cep: franquia.cep
    },
    
    // Destinatário (Fazenda)
    destinatario_cnpj: fazenda.cpf_cnpj,
    destinatario_ie: fazenda.inscricao_estadual,
    destinatario_nome: fazenda.nome,
    destinatario_fone: fazenda.telefone,
    destinatario_endereco: {
      logradouro: fazenda.endereco,
      numero: fazenda.numero,
      bairro: fazenda.bairro,
      municipio: fazenda.cidade,
      uf: fazenda.estado,
      cep: fazenda.cep
    },
    
    // Tomador (Produtor - quem paga o frete)
    tomador_tipo: '3', // Destinatário
    tomador_cnpj: produtor.cpf_cnpj,
    tomador_nome: produtor.nome,
    tomador_endereco: produtor.endereco ? JSON.parse(produtor.endereco) : null,
    
    // Valores
    valor_total_servico: saidaData.valor_frete_calculado || 0,
    valor_receber: saidaData.valor_frete_calculado || 0,
    componentes_valor: [
      {
        nome: 'Frete',
        valor: saidaData.valor_frete_calculado || 0
      }
    ],
    
    // Impostos (valores zerados em rascunho)
    icms_situacao_tributaria: '00',
    icms_base_calculo: saidaData.valor_frete_calculado || 0,
    icms_aliquota: 0,
    icms_valor: 0,
    valor_total_tributos: 0,
    
    // Carga
    valor_carga: 0, // Será calculado depois
    produto_predominante: 'Produtos agrícolas',
    outras_caracteristicas: 'Transporte de produtos agrícolas',
    quantidades: [
      {
        unidade: 'KG',
        tipo: 'Peso',
        quantidade: saida.peso_total || 0
      }
    ],
    
    // Seguro
    responsavel_seguro: '1', // Emitente
    
    // Status
    status: 'rascunho',
    created_by: userId
  }
  
  // Insert CT-e
  const { data: cte, error: cteError } = await supabase
    .from('ctes')
    .insert(cteData)
    .select()
    .single()
  
  if (cteError) throw cteError
  
  console.log('✅ CT-e created in draft status:', cte.id)
  return cte
}

async function updateSaida(supabase: any, userId: string, data: any) {
  const { id, ...updateData } = data
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function deleteSaida(supabase: any, userId: string, saidaId: string) {
  const { error } = await supabase
    .from('saidas')
    .delete()
    .eq('id', saidaId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: saidaId }
}

async function updateSaidaStatus(supabase: any, userId: string, data: any) {
  const { id, status, observacoes } = data
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      status,
      observacoes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function approveSaida(supabase: any, userId: string, data: any) {
  const { id, status_aprovacao, observacoes } = data
  
  const updateData: any = {
    status_aprovacao_produtor: status_aprovacao,
    updated_at: new Date().toISOString()
  }

  if (observacoes) {
    updateData.observacoes = observacoes
  }

  if (status_aprovacao === 'aprovado') {
    updateData.data_aprovacao_produtor = new Date().toISOString()
  }

  const { data: saida, error } = await supabase
    .from('saidas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function allocateToViagem(supabase: any, userId: string, data: any) {
  const { viagemId, saidaId } = data
  
  console.log('📦 Alocando saída à viagem:', { saidaId, viagemId })
  
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      viagem_id: viagemId,
      status: 'alocado_viagem',
      updated_at: new Date().toISOString()
    })
    .eq('id', saidaId)
    .select()
    .single()

  if (error) throw error
  
  // Vincular entradas relacionadas (via documento_fluxo ou saida_origem_id) à viagem
  // Isso permite sincronizar o status da entrada com a viagem
  const { data: entradasRelacionadas, error: entradaError } = await supabase
    .from('entradas')
    .update({
      viagem_id: viagemId,
      updated_at: new Date().toISOString()
    })
    .eq('saida_origem_id', saidaId)
    .select('id')
  
  if (entradaError) {
    console.error('⚠️ Erro ao vincular entradas à viagem:', entradaError)
  } else if (entradasRelacionadas?.length > 0) {
    console.log('✅ Entradas vinculadas à viagem:', entradasRelacionadas.length)
  }
  
  return saida
}

async function deallocateFromViagem(supabase: any, userId: string, saidaId: string) {
  const { data: saida, error } = await supabase
    .from('saidas')
    .update({
      viagem_id: null,
      status: 'expedido',
      updated_at: new Date().toISOString()
    })
    .eq('id', saidaId)
    .select()
    .single()

  if (error) throw error
  return saida
}

async function createDevolucao(supabase: any, userId: string, data: any) {
  const { ocorrencia_id, saida_id, tipo_devolucao, itens_devolvidos, observacoes } = data
  
  console.log('🔄 Iniciando criação de devolução:', { ocorrencia_id, saida_id, tipo_devolucao })
  
  // Validar se a saída existe e pode ter devolução
  const { data: saida, error: saidaError } = await supabase
    .from('saidas')
    .select(`
      *,
      deposito:franquias!deposito_id(id, nome, master_franqueado_id),
      produtor_destinatario:profiles!produtor_destinatario_id(id, nome, cpf_cnpj),
      saida_itens(
        id,
        produto_id,
        quantidade,
        valor_unitario,
        lote,
        produtos(id, nome, codigo, unidade_medida)
      )
    `)
    .eq('id', saida_id)
    .single()
  
  if (saidaError || !saida) {
    throw new Error('Saída não encontrada')
  }
  
  // Validar status da saída
  if (!['expedido', 'entregue'].includes(saida.status)) {
    throw new Error('Devolução só pode ser criada para saídas expedidas ou entregues')
  }
  
  // Criar entrada de devolução
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
  
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert(entradaData)
    .select()
    .single()
  
  if (entradaError) {
    console.error('❌ Erro ao criar entrada de devolução:', entradaError)
    throw entradaError
  }
  
  console.log('✅ Entrada de devolução criada:', entrada.id)
  
  // Criar itens da entrada de devolução
  let itensEntrada = []
  
  if (tipo_devolucao === 'total') {
    // Devolução total: copiar todos os itens
    itensEntrada = saida.saida_itens.map((item: any) => ({
      entrada_id: entrada.id,
      user_id: saida.user_id,
      produto_id: item.produto_id,
      nome_produto: item.produtos.nome,
      codigo_produto: item.produtos.codigo,
      unidade_comercial: item.produtos.unidade_medida,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      lote: item.lote,
      valor_total: item.quantidade * item.valor_unitario
    }))
  } else {
    // Devolução parcial: usar itens especificados
    itensEntrada = itens_devolvidos.map((itemDev: any) => {
      const itemOriginal = saida.saida_itens.find((si: any) => si.id === itemDev.saida_item_id)
      if (!itemOriginal) {
        throw new Error(`Item ${itemDev.saida_item_id} não encontrado na saída original`)
      }
      
      return {
        entrada_id: entrada.id,
        user_id: saida.user_id,
        produto_id: itemOriginal.produto_id,
        nome_produto: itemOriginal.produtos.nome,
        codigo_produto: itemOriginal.produtos.codigo,
        unidade_comercial: itemOriginal.produtos.unidade_medida,
        quantidade: itemDev.quantidade,
        valor_unitario: itemOriginal.valor_unitario,
        lote: itemOriginal.lote,
        valor_total: itemDev.quantidade * itemOriginal.valor_unitario
      }
    })
  }
  
  const { error: itensError } = await supabase
    .from('entrada_itens')
    .insert(itensEntrada)
  
  if (itensError) {
    // Rollback: deletar entrada
    await supabase.from('entradas').delete().eq('id', entrada.id)
    throw itensError
  }
  
  // Atualizar status da saída original
  const novoStatusSaida = tipo_devolucao === 'total' ? 'em_devolucao' : saida.status
  
  const { error: updateSaidaError } = await supabase
    .from('saidas')
    .update({
      status: novoStatusSaida,
      updated_at: new Date().toISOString()
    })
    .eq('id', saida_id)
  
  if (updateSaidaError) {
    console.error('⚠️ Erro ao atualizar status da saída:', updateSaidaError)
  }
  
  // Atualizar ocorrência com devolução criada
  const quantidadeDevolvida = tipo_devolucao === 'total' 
    ? { tipo: 'total', itens: itensEntrada.length }
    : { tipo: 'parcial', itens: itens_devolvidos }
  
  const { error: updateOcorrenciaError } = await supabase
    .from('ocorrencias')
    .update({
      requer_devolucao: true,
      devolucao_id: entrada.id,
      quantidade_devolvida: quantidadeDevolvida,
      updated_at: new Date().toISOString()
    })
    .eq('id', ocorrencia_id)
  
  if (updateOcorrenciaError) {
    console.error('⚠️ Erro ao atualizar ocorrência:', updateOcorrenciaError)
  }
  
  console.log('🎉 Devolução criada com sucesso:', {
    entrada_id: entrada.id,
    tipo: tipo_devolucao,
    itens: itensEntrada.length
  })
  
  return {
    entrada_id: entrada.id,
    saida_id: saida_id,
    tipo_devolucao,
    itens_count: itensEntrada.length,
    status_saida_atualizado: novoStatusSaida
  }
}

// ============================================================================
// INTEGRAÇÃO NATIVA DE DOCUMENTOS FISCAIS (EDI INTERNO)
// ============================================================================

async function processarFluxoDocumentoInterno(supabase: any, userId: string, saida: any, data: any) {
  console.log('🔗 Verificando fluxo de documento interno para saída:', saida.id)
  
  // Detectar destinatário interno
  const destinatarioInterno = await detectarDestinatarioInterno(supabase, data)
  
  if (!destinatarioInterno) {
    console.log('ℹ️ Destinatário não é cliente interno do sistema')
    return null
  }
  
  console.log('✅ Destinatário interno encontrado:', destinatarioInterno.razao_social)
  
  // Buscar cliente origem (quem está emitindo a saída)
  const { data: clienteOrigem } = await supabase
    .from('cliente_usuarios')
    .select('cliente_id, clientes(id, razao_social, cpf_cnpj)')
    .eq('user_id', userId)
    .eq('ativo', true)
    .limit(1)
    .single()
  
  if (!clienteOrigem?.clientes) {
    console.log('ℹ️ Usuário não tem cliente associado, pulando fluxo interno')
    return null
  }
  
  // Determinar tipo de fluxo
  let tipoFluxo = 'venda'
  if (data.finalidade_nfe === 'transferencia') {
    tipoFluxo = 'transferencia'
  } else if (data.finalidade_nfe === 'remessa') {
    tipoFluxo = 'remessa'
  } else if (data.finalidade_nfe === 'devolucao') {
    tipoFluxo = 'devolucao'
  }
  
  // Criar registro de fluxo
  const { data: fluxo, error: fluxoError } = await supabase
    .from('documento_fluxo')
    .insert({
      saida_id: saida.id,
      cliente_origem_id: clienteOrigem.clientes.id,
      cliente_destino_id: destinatarioInterno.id,
      tipo_fluxo: tipoFluxo,
      chave_nfe: data.chave_nfe || null,
      operador_deposito_id: destinatarioInterno.operador_logistico_id || null,
      transportadora_id: data.transportadora_id || null,
      status: 'pendente'
    })
    .select()
    .single()
  
  if (fluxoError) {
    console.error('❌ Erro ao criar documento_fluxo:', fluxoError)
    throw fluxoError
  }
  
  console.log('✅ Documento fluxo criado:', fluxo.id)
  
  // Criar entrada automática para o destinatário
  const entrada = await criarEntradaAutomatica(supabase, saida, destinatarioInterno, fluxo, data)
  
  // Se o destinatário usa operador logístico, notificar WMS
  if (destinatarioInterno.operador_logistico_id) {
    await notificarWMSOperador(supabase, entrada, destinatarioInterno.operador_logistico_id)
  }
  
  // Se tem transportadora cadastrada no sistema, notificar TMS
  if (data.transportadora_id) {
    await notificarTMSTransportadora(supabase, saida, data.transportadora_id)
  }
  
  return fluxo
}

async function detectarDestinatarioInterno(supabase: any, data: any) {
  console.log('🔍 Detectando destinatário interno com dados:', {
    cliente_destinatario_id: data.cliente_destinatario_id,
    destinatario_transferencia_id: data.destinatario_transferencia_id,
    produtor_destinatario_id: data.produtor_destinatario_id,
    finalidade_nfe: data.finalidade_nfe
  })
  
  // 1. PRIORITY: Se cliente_destinatario_id está definido (venda B2B), buscar diretamente
  if (data.cliente_destinatario_id) {
    console.log('✅ Buscando cliente pelo cliente_destinatario_id:', data.cliente_destinatario_id)
    const { data: clienteDestino, error } = await supabase
      .from('clientes')
      .select('*, cliente_depositos(*)')
      .eq('id', data.cliente_destinatario_id)
      .eq('ativo', true)
      .single()
    
    if (error) {
      console.error('❌ Erro ao buscar cliente destinatário:', error)
    } else if (clienteDestino) {
      console.log('✅ Cliente destinatário encontrado:', clienteDestino.razao_social)
      return clienteDestino
    }
  }
  
  // 2. Se é transferência, já temos o cliente destino
  if (data.finalidade_nfe === 'transferencia' && data.destinatario_transferencia_id) {
    console.log('🔄 Transferência - buscando cliente destino:', data.destinatario_transferencia_id)
    const { data: clienteDestino } = await supabase
      .from('clientes')
      .select('*, cliente_depositos(*)')
      .eq('id', data.destinatario_transferencia_id)
      .single()
    
    return clienteDestino
  }
  
  // 3. Buscar pelo CPF/CNPJ do destinatário se existir
  const cpfCnpjDestino = data.destinatario_cpf_cnpj || data.produtor_destinatario_cpf_cnpj
  
  if (!cpfCnpjDestino) {
    // Tentar buscar pelo produtor_destinatario_id se for um profile com cpf_cnpj
    if (data.produtor_destinatario_id) {
      console.log('🔍 Buscando profile do produtor_destinatario_id:', data.produtor_destinatario_id)
      const { data: produtor } = await supabase
        .from('profiles')
        .select('cpf_cnpj')
        .eq('user_id', data.produtor_destinatario_id)
        .single()
      
      if (produtor?.cpf_cnpj) {
        console.log('📋 Profile encontrado com CPF/CNPJ:', produtor.cpf_cnpj)
        const { data: clienteDestino } = await supabase
          .from('clientes')
          .select('*, cliente_depositos(*)')
          .eq('cpf_cnpj', produtor.cpf_cnpj)
          .eq('ativo', true)
          .maybeSingle()
        
        if (clienteDestino) {
          console.log('✅ Cliente encontrado por CPF/CNPJ do profile:', clienteDestino.razao_social)
        }
        return clienteDestino
      }
    }
    console.log('ℹ️ Nenhum identificador de cliente encontrado')
    return null
  }
  
  // 4. Limpar CPF/CNPJ para comparação
  const cpfCnpjLimpo = cpfCnpjDestino.replace(/\D/g, '')
  console.log('🔍 Buscando cliente por CPF/CNPJ:', cpfCnpjLimpo)
  
  // Buscar cliente pelo CPF/CNPJ
  const { data: clienteDestino } = await supabase
    .from('clientes')
    .select('*, cliente_depositos(*)')
    .or(`cpf_cnpj.eq.${cpfCnpjLimpo},cpf_cnpj.eq.${cpfCnpjDestino}`)
    .eq('ativo', true)
    .maybeSingle()
  
  if (clienteDestino) {
    console.log('✅ Cliente encontrado por CPF/CNPJ:', clienteDestino.razao_social)
  }
  
  return clienteDestino
}

async function criarEntradaAutomatica(supabase: any, saida: any, clienteDestino: any, fluxo: any, data: any) {
  console.log('📥 Criando entrada automática para cliente:', clienteDestino.razao_social)
  
  // Buscar itens da saída
  const { data: saidaItens } = await supabase
    .from('saida_itens')
    .select('*, produtos(id, nome, codigo, unidade_medida)')
    .eq('saida_id', saida.id)
  
  // Determinar depósito de destino
  let depositoDestinoId = null
  if (clienteDestino.operador_logistico_id) {
    depositoDestinoId = clienteDestino.operador_logistico_id
  } else if (clienteDestino.cliente_depositos?.length > 0) {
    // Pegar primeiro depósito ativo
    const depositoAtivo = clienteDestino.cliente_depositos.find((d: any) => d.ativo !== false)
    depositoDestinoId = depositoAtivo?.franquia_id
  }
  
  // Buscar um usuário do cliente destino para ser o user_id da entrada
  const { data: usuarioDestino } = await supabase
    .from('cliente_usuarios')
    .select('user_id')
    .eq('cliente_id', clienteDestino.id)
    .eq('ativo', true)
    .limit(1)
    .single()
  
  const userIdDestino = usuarioDestino?.user_id
  
  if (!userIdDestino) {
    console.log('⚠️ Cliente destino não tem usuário ativo, entrada será criada sem user_id específico')
  }
  
  // Determinar natureza da operação baseado no tipo
  let naturezaOperacao = 'Compra de mercadorias'
  if (data.finalidade_nfe === 'transferencia') {
    naturezaOperacao = 'Transferência entre estabelecimentos'
  } else if (data.finalidade_nfe === 'remessa') {
    naturezaOperacao = 'Recebimento de mercadoria em remessa'
  } else if (data.finalidade_nfe === 'devolucao') {
    naturezaOperacao = 'Recebimento de devolução'
  }
  
  // Criar entrada
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert({
      user_id: userIdDestino || saida.user_id,
      deposito_id: depositoDestinoId,
      cliente_id: clienteDestino.id,
      data_entrada: new Date().toISOString().split('T')[0],
      numero_nfe: saida.numero_nfe || `INT-${saida.id.substring(0, 8)}`,
      chave_nfe: saida.chave_nfe || null,
      emitente_cnpj: data.cliente_origem_cnpj || '',
      emitente_nome: data.cliente_origem_nome || 'Fornecedor Interno',
      destinatario_cpf_cnpj: clienteDestino.cpf_cnpj,
      destinatario_nome: clienteDestino.razao_social,
      valor_total: saida.valor_total || 0,
      status_aprovacao: 'aguardando_transporte',
      tipo_recebimento: 'edi_interno',
      saida_origem_id: saida.id,
      documento_fluxo_id: fluxo.id,
      natureza_operacao: naturezaOperacao,
      observacoes: `Documento recebido automaticamente via EDI interno - Saída: ${saida.id}`
    })
    .select()
    .single()
  
  if (entradaError) {
    console.error('❌ Erro ao criar entrada automática:', entradaError)
    throw entradaError
  }
  
  console.log('✅ Entrada automática criada:', entrada.id)
  
  // Criar itens da entrada
  if (saidaItens && saidaItens.length > 0) {
    const itensEntrada = saidaItens.map((item: any) => ({
      entrada_id: entrada.id,
      user_id: userIdDestino || saida.user_id,
      produto_id: item.produto_id,
      nome_produto: item.produtos?.nome || 'Produto',
      codigo_produto: item.produtos?.codigo || item.codigo_produto,
      unidade_comercial: item.produtos?.unidade_medida || 'UN',
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario || 0,
      lote: item.lote,
      valor_total: (item.quantidade || 0) * (item.valor_unitario || 0)
    }))
    
    const { error: itensError } = await supabase
      .from('entrada_itens')
      .insert(itensEntrada)
    
    if (itensError) {
      console.error('❌ Erro ao criar itens da entrada:', itensError)
      // Don't fail the flow, just log
    } else {
      console.log('✅ Itens da entrada criados:', itensEntrada.length)
    }
  }
  
  // Atualizar fluxo com entrada criada
  await supabase
    .from('documento_fluxo')
    .update({ entrada_id: entrada.id })
    .eq('id', fluxo.id)
  
  return entrada
}

async function notificarWMSOperador(supabase: any, entrada: any, operadorDepositoId: string) {
  console.log('📦 Notificando WMS do operador logístico:', operadorDepositoId)
  
  // Buscar usuários do operador logístico
  const { data: operadorUsuarios } = await supabase
    .from('franquia_usuarios')
    .select('user_id')
    .eq('franquia_id', operadorDepositoId)
    .eq('ativo', true)
  
  if (!operadorUsuarios || operadorUsuarios.length === 0) {
    console.log('⚠️ Nenhum usuário encontrado para o operador logístico')
    return
  }
  
  // Criar notificação para cada usuário do operador
  const notificacoes = operadorUsuarios.map((usuario: any) => ({
    user_id: usuario.user_id,
    titulo: '📦 Nova NF-e para Recebimento',
    mensagem: `NF ${entrada.numero_nfe || entrada.id.substring(0, 8)} de ${entrada.emitente_nome} aguardando recebimento no WMS`,
    tipo: 'wms_recebimento',
    referencia_id: entrada.id,
    referencia_tipo: 'entrada',
    lida: false
  }))
  
  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notificacoes)
  
  if (notifError) {
    console.error('⚠️ Erro ao criar notificações WMS:', notifError)
  } else {
    console.log('✅ Notificações WMS enviadas:', notificacoes.length)
  }
}

async function notificarTMSTransportadora(supabase: any, saida: any, transportadoraId: string) {
  console.log('🚚 Notificando TMS da transportadora:', transportadoraId)
  
  // Buscar usuários da transportadora
  const { data: transportadoraUsuarios } = await supabase
    .from('transportadoras_usuarios')
    .select('user_id')
    .eq('transportadora_id', transportadoraId)
    .eq('ativo', true)
  
  if (!transportadoraUsuarios || transportadoraUsuarios.length === 0) {
    console.log('ℹ️ Nenhum usuário TMS encontrado para a transportadora')
    return
  }
  
  // Criar notificação para cada usuário da transportadora
  const notificacoes = transportadoraUsuarios.map((usuario: any) => ({
    user_id: usuario.user_id,
    titulo: '🚚 Nova Remessa para Coleta',
    mensagem: `Remessa ${saida.id.substring(0, 8)} aguardando coleta`,
    tipo: 'tms_coleta',
    referencia_id: saida.id,
    referencia_tipo: 'saida',
    lida: false
  }))
  
  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notificacoes)
  
  if (notifError) {
    console.error('⚠️ Erro ao criar notificações TMS:', notifError)
  } else {
    console.log('✅ Notificações TMS enviadas:', notificacoes.length)
  }
}