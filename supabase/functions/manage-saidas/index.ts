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

    return { ...saida, itens: itensInseridos, cte }
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