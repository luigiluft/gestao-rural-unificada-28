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

  // 🔧 PARTE 1: Identificar e gravar cliente_origem_id e dados do emitente automaticamente
  let clienteOrigemId = data.cliente_origem_id || null
  let clienteEmitenteData: any = null
  
  if (!clienteOrigemId) {
    console.log('🔍 Buscando cliente_origem_id automaticamente...')
    
    // Tentar via cliente_usuarios
    const { data: clienteUsuario } = await supabase
      .from('cliente_usuarios')
      .select('cliente_id')
      .eq('user_id', userId)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    
    if (clienteUsuario?.cliente_id) {
      clienteOrigemId = clienteUsuario.cliente_id
      console.log('✅ Cliente origem encontrado via cliente_usuarios:', clienteOrigemId)
    } else if (data.deposito_id) {
      // Tentar via franquia -> cliente (pelo CNPJ)
      const { data: franquia } = await supabase
        .from('franquias')
        .select('cnpj')
        .eq('id', data.deposito_id)
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
        
        if (cliente?.id) {
          clienteOrigemId = cliente.id
          console.log('✅ Cliente origem encontrado via franquia/depósito:', clienteOrigemId)
        }
      }
    }
  }

  // 🔧 PARTE 1A: Buscar dados COMPLETOS do emitente (cliente origem)
  if (clienteOrigemId) {
    console.log('🔍 Buscando dados completos do emitente:', clienteOrigemId)
    const { data: clienteEmitente, error: emitenteError } = await supabase
      .from('clientes')
      .select(`
        id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual,
        endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal,
        cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial, email_comercial
      `)
      .eq('id', clienteOrigemId)
      .single()
    
    if (emitenteError) {
      console.error('⚠️ Erro ao buscar cliente emitente:', emitenteError)
    } else if (clienteEmitente) {
      clienteEmitenteData = clienteEmitente
      console.log('✅ Dados do emitente encontrados:', clienteEmitente.razao_social)
    }
  } else if (data.deposito_id) {
    // Fallback: buscar dados da franquia como emitente
    console.log('🔍 Buscando dados do emitente via franquia:', data.deposito_id)
    const { data: franquia } = await supabase
      .from('franquias')
      .select(`
        id, nome, razao_social, cnpj, inscricao_estadual,
        endereco, numero, complemento, bairro, cidade, estado, cep, telefone, email
      `)
      .eq('id', data.deposito_id)
      .single()
    
    if (franquia) {
      clienteEmitenteData = {
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
      console.log('✅ Dados do emitente obtidos da franquia:', franquia.nome)
    }
  }

  // 🔧 PARTE 1B: Buscar dados COMPLETOS do cliente destinatário
  let clienteDestinatarioData: any = null
  
  if (data.cliente_destinatario_id) {
    console.log('🔍 Buscando dados completos do cliente destinatário:', data.cliente_destinatario_id)
    const { data: clienteDestino, error: clienteError } = await supabase
      .from('clientes')
      .select(`
        id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual,
        endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal,
        cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial, email_comercial
      `)
      .eq('id', data.cliente_destinatario_id)
      .single()
    
    if (clienteError) {
      console.error('⚠️ Erro ao buscar cliente destinatário:', clienteError)
    } else if (clienteDestino) {
      clienteDestinatarioData = clienteDestino
      console.log('✅ Dados do destinatário encontrados:', clienteDestino.razao_social)
    }
  }

  // Calculate total weight and product value
  const pesoTotal = data.itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0)
  const valorProdutos = data.itens.reduce((sum: number, item: any) => {
    return sum + ((item.quantidade || 0) * (item.preco_unitario || 0))
  }, 0)
  
  // Get freight, insurance, volumes and weight values from form data (if provided)
  const valorFrete = data.valor_frete || 0
  const valorSeguro = data.valor_seguro || 0
  const quantidadeVolumes = data.quantidade_volumes || 0
  const pesoBruto = data.peso_bruto || 0
  const pesoLiquido = data.peso_liquido || 0
  
  console.log('💰 Valores calculados:', { valorProdutos, valorFrete, valorSeguro, quantidadeVolumes, pesoBruto, pesoLiquido })

  // 🔧 PARTE 1C: Processar dados de TRANSPORTE/FRETE
  let transportadoraData: any = null
  
  console.log('🚛 Processando dados de transporte:', {
    modalidade_frete: data.modalidade_frete,
    transportadora_id: data.transportadora_id,
    usar_transportadora_propria: data.usar_transportadora_propria
  })
  
  // Determinar dados da transportadora
  if (data.modalidade_frete === '0' && data.usar_transportadora_propria) {
    // Usar mesmo CNPJ da empresa emitente
    transportadoraData = {
      transportadora_nome: clienteEmitenteData?.razao_social || null,
      transportadora_cnpj: clienteEmitenteData?.cpf_cnpj || null,
      transportadora_ie: clienteEmitenteData?.inscricao_estadual || null,
      transportadora_endereco: clienteEmitenteData?.endereco_fiscal || null,
      transportadora_municipio: clienteEmitenteData?.cidade_fiscal || null,
      transportadora_uf: clienteEmitenteData?.estado_fiscal || null
    }
    console.log('✅ Transportadora própria (mesmo CNPJ da empresa):', transportadoraData.transportadora_cnpj)
  } else if (data.transportadora_id) {
    // Buscar dados da transportadora cadastrada
    const { data: transportadora, error: transpError } = await supabase
      .from('transportadoras')
      .select('id, nome, cnpj, contato, email')
      .eq('id', data.transportadora_id)
      .single()
    
    if (transpError) {
      console.error('⚠️ Erro ao buscar transportadora:', transpError)
    } else if (transportadora) {
      transportadoraData = {
        transportadora_nome: transportadora.nome,
        transportadora_cnpj: transportadora.cnpj,
        transportadora_ie: null,
        transportadora_endereco: null,
        transportadora_municipio: null,
        transportadora_uf: null
      }
      console.log('✅ Transportadora terceirizada encontrada:', transportadora.nome)
    }
  }

  // Create saida data excluding itens and reserva_id
  const { itens, reserva_id, usar_transportadora_propria, ...saidaFields } = data
  const saidaData = {
    user_id: userId,
    ...saidaFields,
    cliente_origem_id: clienteOrigemId, // 🔧 Gravar cliente_origem_id
    peso_total: pesoTotal,
    peso_bruto: pesoTotal,
    peso_liquido: pesoTotal,
    status: 'separacao_pendente',
    status_aprovacao_produtor: userId === data.produtor_destinatario_id ? 'nao_aplicavel' : 'pendente',
    // 🔧 GRAVAR DADOS COMPLETOS DO EMITENTE
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
    // 🔧 GRAVAR DADOS COMPLETOS DO DESTINATÁRIO
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
    // 🔧 GRAVAR DADOS DA TRANSPORTADORA
    ...transportadoraData,
    // 🔧 GRAVAR VALORES FINANCEIROS E VOLUMES
    valor_produtos: valorProdutos,
    valor_frete: valorFrete,
    valor_seguro: valorSeguro,
    quantidade_volumes: quantidadeVolumes,
    peso_bruto: pesoBruto,
    peso_liquido: pesoLiquido,
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
  
  // Buscar cliente origem (quem está emitindo a saída) - NÃO bloquear se não encontrar
  const { data: clienteOrigem } = await supabase
    .from('cliente_usuarios')
    .select('cliente_id, clientes(id, razao_social, cpf_cnpj)')
    .eq('user_id', userId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle()
  
  // Obter dados do cliente origem de várias fontes possíveis
  let clienteOrigemId = clienteOrigem?.clientes?.id || null
  let clienteOrigemNome = clienteOrigem?.clientes?.razao_social || null
  
  // Se não encontrou cliente_usuarios, tentar buscar via franquia_usuarios
  if (!clienteOrigemId) {
    console.log('🔍 Buscando cliente origem via franquia_usuarios...')
    const { data: franquiaUsuario } = await supabase
      .from('franquia_usuarios')
      .select('franquia_id, franquias(id, nome, cnpj)')
      .eq('user_id', userId)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    
    if (franquiaUsuario?.franquias?.cnpj) {
      // Buscar cliente pelo CNPJ da franquia
      const { data: clientePorCnpj } = await supabase
        .from('clientes')
        .select('id, razao_social')
        .eq('cpf_cnpj', franquiaUsuario.franquias.cnpj.replace(/\D/g, ''))
        .eq('ativo', true)
        .maybeSingle()
      
      if (clientePorCnpj) {
        clienteOrigemId = clientePorCnpj.id
        clienteOrigemNome = clientePorCnpj.razao_social
        console.log('✅ Cliente origem encontrado via franquia:', clienteOrigemNome)
      }
    }
  }
  
  // Se ainda não encontrou, tentar criar um registro baseado nos dados da saída
  if (!clienteOrigemId && saida.deposito_id) {
    console.log('🔍 Buscando cliente origem via deposito_id...')
    const { data: franquia } = await supabase
      .from('franquias')
      .select('id, nome, cnpj')
      .eq('id', saida.deposito_id)
      .single()
    
    if (franquia?.cnpj) {
      const { data: clientePorCnpj } = await supabase
        .from('clientes')
        .select('id, razao_social')
        .eq('cpf_cnpj', franquia.cnpj.replace(/\D/g, ''))
        .eq('ativo', true)
        .maybeSingle()
      
      if (clientePorCnpj) {
        clienteOrigemId = clientePorCnpj.id
        clienteOrigemNome = clientePorCnpj.razao_social
        console.log('✅ Cliente origem encontrado via depósito:', clienteOrigemNome)
      }
    }
  }
  
  // Se AINDA não encontrou cliente origem, não bloquear - criar com o destinatário como referência
  if (!clienteOrigemId) {
    console.log('⚠️ Cliente origem não encontrado, mas continuando com fluxo interno...')
    // Usar o próprio destinatário como referência temporária ou deixar null
    // A entrada será criada mesmo assim para o destinatário poder receber
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
  
  // Criar registro de fluxo - só se tiver cliente_origem_id
  if (!clienteOrigemId) {
    console.log('⚠️ Não foi possível criar documento_fluxo sem cliente origem, mas entrada será criada')
    // Criar entrada diretamente sem o fluxo
    const entrada = await criarEntradaAutomatica(supabase, saida, destinatarioInterno, null, data)
    
    // Se o destinatário usa operador logístico, notificar WMS
    if (destinatarioInterno.operador_logistico_id) {
      await notificarWMSOperador(supabase, entrada, destinatarioInterno.operador_logistico_id)
    }
    
    return null
  }
  
  const { data: fluxo, error: fluxoError } = await supabase
    .from('documento_fluxo')
    .insert({
      saida_id: saida.id,
      cliente_origem_id: clienteOrigemId,
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
    .select('*, produtos(id, nome, codigo, unidade_medida, preco_unitario)')
    .eq('saida_id', saida.id)
  
  // 🔧 PARTE 2: Buscar dados COMPLETOS do cliente origem (emitente)
  let clienteOrigemData: any = null
  
  if (saida.cliente_origem_id) {
    console.log('🔍 Buscando dados completos do cliente origem:', saida.cliente_origem_id)
    const { data: clienteOrigem } = await supabase
      .from('clientes')
      .select(`
        id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual,
        endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal,
        cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial
      `)
      .eq('id', saida.cliente_origem_id)
      .single()
    
    if (clienteOrigem) {
      clienteOrigemData = clienteOrigem
      console.log('✅ Dados do emitente encontrados:', clienteOrigem.razao_social)
    }
  }
  
  // Fallback: buscar via franquia/depósito se não encontrou cliente_origem_id
  if (!clienteOrigemData && saida.deposito_id) {
    console.log('🔍 Buscando dados do emitente via depósito:', saida.deposito_id)
    const { data: franquia } = await supabase
      .from('franquias')
      .select('id, nome, cnpj, razao_social, inscricao_estadual, endereco, numero, complemento, bairro, cidade, estado, cep, telefone')
      .eq('id', saida.deposito_id)
      .single()
    
    if (franquia?.cnpj) {
      // Primeiro tentar buscar cliente pelo CNPJ para dados mais completos
      const cnpjLimpo = franquia.cnpj.replace(/\D/g, '')
      const { data: clientePorCnpj } = await supabase
        .from('clientes')
        .select(`
          id, razao_social, nome_fantasia, cpf_cnpj, inscricao_estadual,
          endereco_fiscal, numero_fiscal, complemento_fiscal, bairro_fiscal,
          cidade_fiscal, estado_fiscal, cep_fiscal, telefone_comercial
        `)
        .or(`cpf_cnpj.eq.${cnpjLimpo},cpf_cnpj.eq.${franquia.cnpj}`)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()
      
      if (clientePorCnpj) {
        clienteOrigemData = clientePorCnpj
        console.log('✅ Dados do emitente encontrados via cliente/CNPJ:', clientePorCnpj.razao_social)
      } else {
        // Usar dados da própria franquia
        clienteOrigemData = {
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
          telefone_comercial: franquia.telefone
        }
        console.log('✅ Dados do emitente obtidos da franquia:', franquia.nome)
      }
    }
  }
  
  // 🔧 PARTE 2B: Buscar dados da transportadora se existir
  let transportadoraData: any = null
  if (saida.transportadora_id) {
    console.log('🚚 Buscando dados da transportadora:', saida.transportadora_id)
    const { data: transportadora } = await supabase
      .from('transportadoras')
      .select('razao_social, cnpj, endereco, cidade, estado')
      .eq('id', saida.transportadora_id)
      .single()
    
    if (transportadora) {
      transportadoraData = transportadora
      console.log('✅ Dados da transportadora encontrados:', transportadora.razao_social)
    }
  }
  
  // 🔧 PARTE 3: Calcular totais dos itens
  let valorProdutos = 0
  let quantidadeVolumes = 0
  
  if (saidaItens && saidaItens.length > 0) {
    for (const item of saidaItens) {
      valorProdutos += (item.quantidade || 0) * (item.valor_unitario || 0)
      quantidadeVolumes += item.quantidade || 0
    }
    console.log('📊 Totais calculados - Valor produtos:', valorProdutos, 'Volumes:', quantidadeVolumes)
  }
  
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
  
  // Montar endereço completo do emitente
  const enderecoCompletoEmitente = clienteOrigemData ? 
    [
      clienteOrigemData.endereco_fiscal,
      clienteOrigemData.numero_fiscal,
      clienteOrigemData.bairro_fiscal,
      clienteOrigemData.cidade_fiscal,
      clienteOrigemData.estado_fiscal
    ].filter(Boolean).join(', ') : null
  
  // Criar entrada com TODOS os dados mapeados da saída
  const { data: entrada, error: entradaError } = await supabase
    .from('entradas')
    .insert({
      user_id: userIdDestino || saida.user_id,
      deposito_id: depositoDestinoId,
      cliente_id: clienteDestino.id,
      data_entrada: new Date().toISOString().split('T')[0],
      numero_nfe: saida.numero_nfe || `INT-${saida.id.substring(0, 8)}`,
      chave_nfe: saida.chave_nfe || null,
      serie: saida.serie_nfe || null,
      
      // 🔧 Dados COMPLETOS do emitente
      emitente_nome: clienteOrigemData?.razao_social || 'Fornecedor Interno',
      emitente_nome_fantasia: clienteOrigemData?.nome_fantasia || null,
      emitente_cnpj: clienteOrigemData?.cpf_cnpj || '',
      emitente_ie: clienteOrigemData?.inscricao_estadual || null,
      emitente_logradouro: clienteOrigemData?.endereco_fiscal || null,
      emitente_numero: clienteOrigemData?.numero_fiscal || null,
      emitente_complemento: clienteOrigemData?.complemento_fiscal || null,
      emitente_bairro: clienteOrigemData?.bairro_fiscal || null,
      emitente_municipio: clienteOrigemData?.cidade_fiscal || null,
      emitente_uf: clienteOrigemData?.estado_fiscal || null,
      emitente_cep: clienteOrigemData?.cep_fiscal || null,
      emitente_telefone: clienteOrigemData?.telefone_comercial || null,
      emitente_endereco: enderecoCompletoEmitente,
      
      // 🔧 Dados COMPLETOS do destinatário
      destinatario_nome: clienteDestino.razao_social || null,
      destinatario_cpf_cnpj: clienteDestino.cpf_cnpj || null,
      destinatario_ie: clienteDestino.inscricao_estadual || null,
      destinatario_logradouro: clienteDestino.endereco_fiscal || null,
      destinatario_numero: clienteDestino.numero_fiscal || null,
      destinatario_complemento: clienteDestino.complemento_fiscal || null,
      destinatario_bairro: clienteDestino.bairro_fiscal || null,
      destinatario_municipio: clienteDestino.cidade_fiscal || null,
      destinatario_uf: clienteDestino.estado_fiscal || null,
      destinatario_cep: clienteDestino.cep_fiscal || null,
      destinatario_telefone: clienteDestino.telefone_comercial || null,
      
      // 🔧 Dados da transportadora
      transportadora_nome: transportadoraData?.razao_social || null,
      transportadora_cnpj: transportadoraData?.cnpj || null,
      transportadora_endereco: transportadoraData?.endereco || null,
      transportadora_municipio: transportadoraData?.cidade || null,
      transportadora_uf: transportadoraData?.estado || null,
      
      // 🔧 Dados de transporte (veículo/motorista)
      placa_veiculo: saida.placa_veiculo || null,
      uf_veiculo: saida.uf_veiculo || null,
      veiculo_placa: saida.placa_veiculo || null,
      nome_motorista: saida.nome_motorista || null,
      modalidade_frete: saida.modalidade_frete || null,
      
      // 🔧 Pesos
      peso_bruto: saida.peso_total || null,
      peso_liquido: saida.peso_total || null,
      
      // 🔧 Valores e quantidades
      valor_total: saida.valor_total || valorProdutos || 0,
      valor_produtos: saida.valor_produtos || valorProdutos || null,
      valor_frete: saida.valor_frete || saida.valor_frete_calculado || null,
      valor_seguro: saida.valor_seguro || null,
      quantidade_volumes: quantidadeVolumes || null,
      
      // 🔧 Datas
      dh_emissao: saida.data_saida ? new Date(saida.data_saida).toISOString() : null,
      dh_saida_entrada: new Date().toISOString(),
      
      // Outros campos
      status_aprovacao: 'pendente_aprovacao',
      tipo_recebimento: 'edi_interno',
      saida_origem_id: saida.id,
      documento_fluxo_id: fluxo?.id || null,
      natureza_operacao: naturezaOperacao,
      observacoes: `Documento recebido automaticamente via EDI interno - Saída: ${saida.id}`
    })
    .select()
    .single()
  
  if (entradaError) {
    console.error('❌ Erro ao criar entrada automática:', entradaError)
    throw entradaError
  }
  
  console.log('✅ Entrada automática criada:', entrada.id, 'com emitente:', clienteOrigemData?.razao_social || 'N/A')
  
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
  
  // Atualizar fluxo com entrada criada (somente se fluxo existir)
  if (fluxo?.id) {
    await supabase
      .from('documento_fluxo')
      .update({ entrada_id: entrada.id })
      .eq('id', fluxo.id)
  }
  
  // 🔗 RASTREABILIDADE: Atualizar saída com referência à entrada gerada
  const { error: updateSaidaError } = await supabase
    .from('saidas')
    .update({ entrada_gerada_id: entrada.id })
    .eq('id', saida.id)
  
  if (updateSaidaError) {
    console.error('⚠️ Erro ao atualizar saída com entrada_gerada_id:', updateSaidaError)
  } else {
    console.log('✅ Saída atualizada com entrada_gerada_id:', entrada.id)
  }
  
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