// Parser para XML de Nota Fiscal Eletrônica
export interface NFItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  lote?: string;
  dataValidade?: string;
  quantidadeLote?: number;
  dataFabricacao?: string;
  codigoEAN?: string; // Código de barras EAN
}

export interface NFData {
  numeroNF: string;
  serie: string;
  chaveNFe: string;
  naturezaOperacao: string;
  dataEmissao: string;
  xmlContent?: string;
  emitente: {
    cnpj: string;
    nome: string;
    nomeFantasia?: string;
    endereco: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
    codigo_municipio?: string;
    codigo_pais?: string;
    telefone?: string;
    ie?: string;
    crt?: string;
  };
  destinatario: {
    cpfCnpj: string;
    nome: string;
    endereco: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
    codigo_municipio?: string;
    codigo_pais?: string;
    pais?: string;
    telefone?: string;
    ind_ie?: string;
    ie?: string;
    email?: string;
  };
  entrega?: {
    cnpj: string;
    ie?: string;
    endereco: string;
    nome?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
    telefone?: string;
  };
  destinatarioCpfCnpj: string;
  itens: NFItem[];
  valorTotal: number;
  // Campos adicionais da NFe
  versao_nfe?: string;
  cuf?: string;
  cnf?: string;
  modelo?: string;
  dh_emissao?: string;
  dh_saida_entrada?: string;
  tipo_nf?: string;
  id_dest?: string;
  cmun_fg?: string;
  tipo_impressao?: string;
  tipo_emissao?: string;
  digito_verificador?: string;
  tipo_ambiente?: string;
  finalidade_nfe?: string;
  ind_final?: string;
  ind_pres?: string;
  ind_intermediador?: string;
  processo_emissao?: string;
  versao_processo?: string;
  // Dados de transporte
  modalidade_frete?: string;
  transportadora_cnpj?: string;
  transportadora_nome?: string;
  transportadora_endereco?: string;
  transportadora_municipio?: string;
  transportadora_uf?: string;
  veiculo_placa?: string;
  veiculo_uf?: string;
  quantidade_volumes?: number;
  peso_liquido?: number;
  peso_bruto?: number;
  // Dados de pagamento
  numero_fatura?: string;
  valor_original_fatura?: number;
  valor_desconto_fatura?: number;
  valor_liquido_fatura?: number;
  numero_duplicata?: string;
  data_vencimento_duplicata?: string;
  valor_duplicata?: number;
  indicador_pagamento?: string;
  tipo_pagamento?: string;
  descricao_pagamento?: string;
  valor_pagamento?: number;
  // Valores totais
  valor_produtos?: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_ii?: number;
  valor_ipi?: number;
  valor_ipi_devolvido?: number;
  valor_pis?: number;
  valor_cofins?: number;
  valor_outros?: number;
  valor_total_tributos?: number;
  // Dados de protocolo
  tipo_ambiente_protocolo?: string;
  versao_aplicativo?: string;
  data_recebimento?: string;
  numero_protocolo?: string;
  digest_value?: string;
  codigo_status?: string;
  motivo_status?: string;
  // Pedido de compra
  numero_pedido_compra?: string;
}

export class NFParser {
  static parseXML(xmlContent: string): NFData | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Verificar se é um XML válido de NFe
      const nfeProc = xmlDoc.querySelector('nfeProc');
      if (!nfeProc) {
        throw new Error('XML não é uma NFe válida');
      }

      // Extrair chave da NFe
      const infNFe = xmlDoc.querySelector('infNFe');
      const chaveNFe = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';
      const versao_nfe = infNFe?.getAttribute('versao') || '';

      // Extrair dados básicos da NFe
      const ide = xmlDoc.querySelector('ide');
      const numeroNF = ide?.querySelector('nNF')?.textContent || '';
      const serie = ide?.querySelector('serie')?.textContent || '';
      const naturezaOperacao = ide?.querySelector('natOp')?.textContent || '';
      const dataEmissao = ide?.querySelector('dhEmi')?.textContent?.split('T')[0] || '';
      
      // Extrair campos adicionais da seção ide
      const cuf = ide?.querySelector('cUF')?.textContent || '';
      const cnf = ide?.querySelector('cNF')?.textContent || '';
      const modelo = ide?.querySelector('mod')?.textContent || '';
      const dh_emissao = ide?.querySelector('dhEmi')?.textContent || '';
      const dh_saida_entrada = ide?.querySelector('dhSaiEnt')?.textContent || '';
      const tipo_nf = ide?.querySelector('tpNF')?.textContent || '';
      const id_dest = ide?.querySelector('idDest')?.textContent || '';
      const cmun_fg = ide?.querySelector('cMunFG')?.textContent || '';
      const tipo_impressao = ide?.querySelector('tpImp')?.textContent || '';
      const tipo_emissao = ide?.querySelector('tpEmis')?.textContent || '';
      const digito_verificador = ide?.querySelector('cDV')?.textContent || '';
      const tipo_ambiente = ide?.querySelector('tpAmb')?.textContent || '';
      const finalidade_nfe = ide?.querySelector('finNFe')?.textContent || '';
      const ind_final = ide?.querySelector('indFinal')?.textContent || '';
      const ind_pres = ide?.querySelector('indPres')?.textContent || '';
      const ind_intermediador = ide?.querySelector('indIntermed')?.textContent || '';
      const processo_emissao = ide?.querySelector('procEmi')?.textContent || '';
      const versao_processo = ide?.querySelector('verProc')?.textContent || '';
      const numero_pedido_compra = ide?.querySelector('xPed')?.textContent || '';

      // Extrair dados do emitente
      const emit = xmlDoc.querySelector('emit');
      const enderEmit = emit?.querySelector('enderEmit');
      const emitente = {
        cnpj: emit?.querySelector('CNPJ')?.textContent || '',
        nome: emit?.querySelector('xNome')?.textContent || '',
        nomeFantasia: emit?.querySelector('xFant')?.textContent || undefined,
        endereco: this.formatarEndereco(enderEmit),
        logradouro: enderEmit?.querySelector('xLgr')?.textContent || undefined,
        numero: enderEmit?.querySelector('nro')?.textContent || undefined,
        complemento: enderEmit?.querySelector('xCpl')?.textContent || undefined,
        bairro: enderEmit?.querySelector('xBairro')?.textContent || undefined,
        municipio: enderEmit?.querySelector('xMun')?.textContent || undefined,
        uf: enderEmit?.querySelector('UF')?.textContent || undefined,
        cep: enderEmit?.querySelector('CEP')?.textContent || undefined,
        codigo_municipio: enderEmit?.querySelector('cMun')?.textContent || undefined,
        codigo_pais: enderEmit?.querySelector('cPais')?.textContent || undefined,
        telefone: enderEmit?.querySelector('fone')?.textContent || undefined,
        ie: emit?.querySelector('IE')?.textContent || undefined,
        crt: emit?.querySelector('CRT')?.textContent || undefined
      };

      // Extrair dados do destinatário
      const dest = xmlDoc.querySelector('dest');
      const enderDest = dest?.querySelector('enderDest');
      const destinatarioCpfCnpj = dest?.querySelector('CNPJ')?.textContent || dest?.querySelector('CPF')?.textContent || '';
      const destinatario = {
        cpfCnpj: destinatarioCpfCnpj,
        nome: dest?.querySelector('xNome')?.textContent || '',
        endereco: this.formatarEndereco(enderDest),
        logradouro: enderDest?.querySelector('xLgr')?.textContent || undefined,
        numero: enderDest?.querySelector('nro')?.textContent || undefined,
        complemento: enderDest?.querySelector('xCpl')?.textContent || undefined,
        bairro: enderDest?.querySelector('xBairro')?.textContent || undefined,
        municipio: enderDest?.querySelector('xMun')?.textContent || undefined,
        uf: enderDest?.querySelector('UF')?.textContent || undefined,
        cep: enderDest?.querySelector('CEP')?.textContent || undefined,
        codigo_municipio: enderDest?.querySelector('cMun')?.textContent || undefined,
        codigo_pais: enderDest?.querySelector('cPais')?.textContent || undefined,
        pais: enderDest?.querySelector('xPais')?.textContent || undefined,
        telefone: enderDest?.querySelector('fone')?.textContent || undefined,
        ind_ie: dest?.querySelector('indIEDest')?.textContent || undefined,
        ie: dest?.querySelector('IE')?.textContent || undefined,
        email: dest?.querySelector('email')?.textContent || undefined
      };

      // Extrair dados da entrega (local onde será entregue a mercadoria)
      const entrega = xmlDoc.querySelector('entrega');
      let entregaData = undefined;
      if (entrega) {
        const entregaCnpj = entrega.querySelector('CNPJ')?.textContent || '';
        const entregaIe = entrega.querySelector('IE')?.textContent || undefined;
        
        if (entregaCnpj) {
          entregaData = {
            cnpj: entregaCnpj,
            ie: entregaIe,
            endereco: this.formatarEnderecoEntrega(entrega),
            nome: entrega.querySelector('xNome')?.textContent || undefined,
            logradouro: entrega.querySelector('xLgr')?.textContent || undefined,
            numero: entrega.querySelector('nro')?.textContent || undefined,
            bairro: entrega.querySelector('xBairro')?.textContent || undefined,
            municipio: entrega.querySelector('xMun')?.textContent || undefined,
            uf: entrega.querySelector('UF')?.textContent || undefined,
            cep: entrega.querySelector('CEP')?.textContent || undefined,
            telefone: entrega.querySelector('fone')?.textContent || undefined
          };
        }
      }

      // Extrair itens
      const detElements = xmlDoc.querySelectorAll('det');
      const itens: NFItem[] = [];
      
      detElements.forEach(det => {
        const prod = det.querySelector('prod');
        if (prod) {
          // Primeiro tenta pegar o nome comercial (xProd), depois outros campos possíveis
          let descricao = prod.querySelector('xProd')?.textContent || '';
          
          // Se a descrição contém apenas números ou parece ser numeração de NFe, 
          // tentar outros campos possíveis
          if (!descricao || /^\d+$/.test(descricao.trim()) || descricao.includes('NFe')) {
            // Tentar campo de descrição mais detalhada se existir
            descricao = prod.querySelector('descricao')?.textContent || 
                       prod.querySelector('nome')?.textContent || 
                       prod.querySelector('produto')?.textContent ||
                       descricao;
          }
          
          // Extrair dados de rastreabilidade (lote, data de validade, quantidade do lote e data de fabricação)
          const rastro = prod.querySelector('rastro');
          let lote = '';
          let dataValidade: string | undefined;
          let quantidadeLote: number | undefined;
          let dataFabricacao: string | undefined;
          
          if (rastro) {
            // nLote = número do lote
            lote = rastro.querySelector('nLote')?.textContent || '';
            // dVal = data de validade no formato YYYY-MM-DD
            const dVal = rastro.querySelector('dVal')?.textContent;
            if (dVal) {
              dataValidade = dVal;
            }
            // qLote = quantidade do lote
            const qLote = rastro.querySelector('qLote')?.textContent;
            if (qLote) {
              quantidadeLote = parseFloat(qLote);
            }
            // dFab = data de fabricação no formato YYYY-MM-DD
            const dFab = rastro.querySelector('dFab')?.textContent;
            if (dFab) {
              dataFabricacao = dFab;
            }
          }
          
          const item: NFItem = {
            codigo: prod.querySelector('cProd')?.textContent || '',
            descricao: descricao || 'Produto sem descrição',
            quantidade: parseFloat(prod.querySelector('qCom')?.textContent || '0'),
            unidade: prod.querySelector('uCom')?.textContent || '',
            valorUnitario: parseFloat(prod.querySelector('vUnCom')?.textContent || '0'),
            valorTotal: parseFloat(prod.querySelector('vProd')?.textContent || '0'),
            lote,
            dataValidade,
            quantidadeLote,
            dataFabricacao,
            codigoEAN: prod.querySelector('cEAN')?.textContent || '' // Capturar código EAN
          };
          itens.push(item);
        }
      });

      // Extrair valor total e valores detalhados
      const total = xmlDoc.querySelector('ICMSTot');
      console.log('🔍 Seção ICMSTot encontrada:', total ? 'SIM' : 'NÃO');
      
      const valorTotal = parseFloat(total?.querySelector('vNF')?.textContent || '0');
      const valor_produtos = total?.querySelector('vProd')?.textContent ? parseFloat(total.querySelector('vProd')!.textContent!) : undefined;
      const valor_frete = total?.querySelector('vFrete')?.textContent ? parseFloat(total.querySelector('vFrete')!.textContent!) : undefined;
      const valor_seguro = total?.querySelector('vSeg')?.textContent ? parseFloat(total.querySelector('vSeg')!.textContent!) : undefined;
      const valor_desconto = total?.querySelector('vDesc')?.textContent ? parseFloat(total.querySelector('vDesc')!.textContent!) : undefined;
      const valor_ii = total?.querySelector('vII')?.textContent ? parseFloat(total.querySelector('vII')!.textContent!) : undefined;
      const valor_ipi = total?.querySelector('vIPI')?.textContent ? parseFloat(total.querySelector('vIPI')!.textContent!) : undefined;
      const valor_ipi_devolvido = total?.querySelector('vIPIDevol')?.textContent ? parseFloat(total.querySelector('vIPIDevol')!.textContent!) : undefined;
      const valor_pis = total?.querySelector('vPIS')?.textContent ? parseFloat(total.querySelector('vPIS')!.textContent!) : undefined;
      const valor_cofins = total?.querySelector('vCOFINS')?.textContent ? parseFloat(total.querySelector('vCOFINS')!.textContent!) : undefined;
      const valor_outros = total?.querySelector('vOutro')?.textContent ? parseFloat(total.querySelector('vOutro')!.textContent!) : undefined;
      const valor_total_tributos = total?.querySelector('vTotTrib')?.textContent ? parseFloat(total.querySelector('vTotTrib')!.textContent!) : undefined;
      
      console.log('💰 Valores Totais extraídos:', {
        valor_produtos,
        valor_frete,
        valor_seguro,
        valor_desconto,
        valor_ii,
        valor_ipi,
        valor_ipi_devolvido,
        valor_pis,
        valor_cofins,
        valor_outros,
        valor_total_tributos
      });

      // Extrair dados de transporte
      const transp = xmlDoc.querySelector('transp');
      console.log('🚚 Seção transp encontrada:', transp ? 'SIM' : 'NÃO');
      
      const modalidade_frete = transp?.querySelector('modFrete')?.textContent || undefined;
      
      const transporta = transp?.querySelector('transporta');
      console.log('🚛 Seção transporta encontrada:', transporta ? 'SIM' : 'NÃO');
      
      const transportadora_cnpj = transporta?.querySelector('CNPJ')?.textContent || transporta?.querySelector('CPF')?.textContent || undefined;
      const transportadora_nome = transporta?.querySelector('xNome')?.textContent || undefined;
      const transportadora_municipio = transporta?.querySelector('xMun')?.textContent || undefined;
      const transportadora_uf = transporta?.querySelector('UF')?.textContent || undefined;
      
      // Montar endereço da transportadora
      const transportadora_endereco = [
        transporta?.querySelector('xEnder')?.textContent,
        transportadora_municipio,
        transportadora_uf
      ].filter(Boolean).join(', ') || undefined;
      
      const veicTransp = transp?.querySelector('veicTransp');
      console.log('🚗 Seção veicTransp encontrada:', veicTransp ? 'SIM' : 'NÃO');
      
      const veiculo_placa = veicTransp?.querySelector('placa')?.textContent || undefined;
      const veiculo_uf = veicTransp?.querySelector('UF')?.textContent || undefined;
      
      const vol = transp?.querySelector('vol');
      console.log('📦 Seção vol encontrada:', vol ? 'SIM' : 'NÃO');
      
      const quantidade_volumes = vol?.querySelector('qVol')?.textContent ? parseFloat(vol.querySelector('qVol')!.textContent!) : undefined;
      const peso_liquido = vol?.querySelector('pesoL')?.textContent ? parseFloat(vol.querySelector('pesoL')!.textContent!) : undefined;
      const peso_bruto = vol?.querySelector('pesoB')?.textContent ? parseFloat(vol.querySelector('pesoB')!.textContent!) : undefined;
      
      console.log('🚚 Dados de Transporte extraídos:', {
        modalidade_frete,
        transportadora_cnpj,
        transportadora_nome,
        transportadora_endereco,
        transportadora_municipio,
        transportadora_uf,
        veiculo_placa,
        veiculo_uf,
        quantidade_volumes,
        peso_liquido,
        peso_bruto
      });

      // Extrair dados de cobrança/pagamento
      const cobr = xmlDoc.querySelector('cobr');
      console.log('💳 Seção cobr encontrada:', cobr ? 'SIM' : 'NÃO');
      
      const fat = cobr?.querySelector('fat');
      console.log('🧾 Seção fat encontrada:', fat ? 'SIM' : 'NÃO');
      
      const numero_fatura = fat?.querySelector('nFat')?.textContent || undefined;
      const valor_original_fatura = fat?.querySelector('vOrig')?.textContent ? parseFloat(fat.querySelector('vOrig')!.textContent!) : undefined;
      const valor_desconto_fatura = fat?.querySelector('vDesc')?.textContent ? parseFloat(fat.querySelector('vDesc')!.textContent!) : undefined;
      const valor_liquido_fatura = fat?.querySelector('vLiq')?.textContent ? parseFloat(fat.querySelector('vLiq')!.textContent!) : undefined;
      
      const dup = cobr?.querySelector('dup');
      console.log('📄 Seção dup encontrada:', dup ? 'SIM' : 'NÃO');
      
      const numero_duplicata = dup?.querySelector('nDup')?.textContent || undefined;
      const data_vencimento_duplicata = dup?.querySelector('dVenc')?.textContent || undefined;
      const valor_duplicata = dup?.querySelector('vDup')?.textContent ? parseFloat(dup.querySelector('vDup')!.textContent!) : undefined;
      
      const pag = xmlDoc.querySelector('pag');
      console.log('💰 Seção pag encontrada:', pag ? 'SIM' : 'NÃO');
      
      const detPag = pag?.querySelector('detPag');
      console.log('💵 Seção detPag encontrada:', detPag ? 'SIM' : 'NÃO');
      
      const indicador_pagamento = pag?.querySelector('indPag')?.textContent || undefined;
      const tipo_pagamento = detPag?.querySelector('tPag')?.textContent || undefined;
      const descricao_pagamento = detPag?.querySelector('xPag')?.textContent || undefined;
      const valor_pagamento = detPag?.querySelector('vPag')?.textContent ? parseFloat(detPag.querySelector('vPag')!.textContent!) : undefined;
      
      console.log('💳 Dados de Pagamento extraídos:', {
        numero_fatura,
        valor_original_fatura,
        valor_desconto_fatura,
        valor_liquido_fatura,
        numero_duplicata,
        data_vencimento_duplicata,
        valor_duplicata,
        indicador_pagamento,
        tipo_pagamento,
        descricao_pagamento,
        valor_pagamento
      });

      // Extrair dados do protocolo de autorização
      const protNFe = xmlDoc.querySelector('protNFe');
      console.log('🔐 Seção protNFe encontrada:', protNFe ? 'SIM' : 'NÃO');
      
      const infProt = protNFe?.querySelector('infProt');
      console.log('ℹ️ Seção infProt encontrada:', infProt ? 'SIM' : 'NÃO');
      
      const tipo_ambiente_protocolo = infProt?.querySelector('tpAmb')?.textContent || undefined;
      const versao_aplicativo = infProt?.querySelector('verAplic')?.textContent || undefined;
      const data_recebimento = infProt?.querySelector('dhRecbto')?.textContent || undefined;
      const numero_protocolo = infProt?.querySelector('nProt')?.textContent || undefined;
      const digest_value = infProt?.querySelector('digVal')?.textContent || undefined;
      const codigo_status = infProt?.querySelector('cStat')?.textContent || undefined;
      const motivo_status = infProt?.querySelector('xMotivo')?.textContent || undefined;
      
      console.log('🔐 Dados de Protocolo extraídos:', {
        tipo_ambiente_protocolo,
        versao_aplicativo,
        data_recebimento,
        numero_protocolo,
        digest_value,
        codigo_status,
        motivo_status
      });
      
      console.log('📋 Pedido de Compra:', { numero_pedido_compra });
      
      console.log('✅ Parsing XML completo - todos os campos novos:', {
        valores_totais: { valor_produtos, valor_frete, valor_seguro, valor_desconto, valor_ii, valor_ipi, valor_ipi_devolvido, valor_pis, valor_cofins, valor_outros, valor_total_tributos },
        transporte: { modalidade_frete, transportadora_cnpj, transportadora_nome, veiculo_placa, veiculo_uf, quantidade_volumes, peso_liquido, peso_bruto },
        pagamento: { numero_fatura, valor_original_fatura, numero_duplicata, data_vencimento_duplicata, valor_duplicata, indicador_pagamento, tipo_pagamento, valor_pagamento },
        protocolo: { tipo_ambiente_protocolo, versao_aplicativo, data_recebimento, numero_protocolo, digest_value, codigo_status, motivo_status },
        pedido: { numero_pedido_compra }
      });

      return {
        numeroNF,
        serie,
        chaveNFe,
        naturezaOperacao,
        dataEmissao,
        xmlContent,
        emitente,
        destinatario,
        entrega: entregaData,
        destinatarioCpfCnpj,
        itens,
        valorTotal,
        // Campos adicionais
        versao_nfe,
        cuf,
        cnf,
        modelo,
        dh_emissao,
        dh_saida_entrada,
        tipo_nf,
        id_dest,
        cmun_fg,
        tipo_impressao,
        tipo_emissao,
        digito_verificador,
        tipo_ambiente,
        finalidade_nfe,
        ind_final,
        ind_pres,
        ind_intermediador,
        processo_emissao,
        versao_processo,
        // Dados de transporte
        modalidade_frete,
        transportadora_cnpj,
        transportadora_nome,
        transportadora_endereco,
        transportadora_municipio,
        transportadora_uf,
        veiculo_placa,
        veiculo_uf,
        quantidade_volumes,
        peso_liquido,
        peso_bruto,
        // Dados de pagamento
        numero_fatura,
        valor_original_fatura,
        valor_desconto_fatura,
        valor_liquido_fatura,
        numero_duplicata,
        data_vencimento_duplicata,
        valor_duplicata,
        indicador_pagamento,
        tipo_pagamento,
        descricao_pagamento,
        valor_pagamento,
        // Valores totais
        valor_produtos,
        valor_frete,
        valor_seguro,
        valor_desconto,
        valor_ii,
        valor_ipi,
        valor_ipi_devolvido,
        valor_pis,
        valor_cofins,
        valor_outros,
        valor_total_tributos,
        // Dados de protocolo
        tipo_ambiente_protocolo,
        versao_aplicativo,
        data_recebimento,
        numero_protocolo,
        digest_value,
        codigo_status,
        motivo_status,
        // Pedido de compra
        numero_pedido_compra
      };
    } catch (error) {
      console.error('Erro ao processar XML:', error);
      return null;
    }
  }

  private static formatarEndereco(endereco: Element | null): string {
    if (!endereco) return '';
    
    const logradouro = endereco.querySelector('xLgr')?.textContent || '';
    const numero = endereco.querySelector('nro')?.textContent || '';
    const bairro = endereco.querySelector('xBairro')?.textContent || '';
    const cidade = endereco.querySelector('xMun')?.textContent || '';
    const uf = endereco.querySelector('UF')?.textContent || '';
    const cep = endereco.querySelector('CEP')?.textContent || '';
    
    return `${logradouro}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP: ${cep}`.trim();
  }

  private static formatarEnderecoEntrega(entrega: Element | null): string {
    if (!entrega) return '';
    
    const logradouro = entrega.querySelector('xLgr')?.textContent || '';
    const numero = entrega.querySelector('nro')?.textContent || '';
    const complemento = entrega.querySelector('xCpl')?.textContent || '';
    const bairro = entrega.querySelector('xBairro')?.textContent || '';
    const cidade = entrega.querySelector('xMun')?.textContent || '';
    const uf = entrega.querySelector('UF')?.textContent || '';
    const cep = entrega.querySelector('CEP')?.textContent || '';
    
    let endereco = `${logradouro}, ${numero}`;
    if (complemento) endereco += ` - ${complemento}`;
    endereco += ` - ${bairro}, ${cidade}/${uf} - CEP: ${cep}`;
    
    return endereco.trim();
  }

  static validateXML(xmlContent: string): boolean {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Verificar se não há erros de parsing
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) return false;
      
      // Verificar se é uma NFe
      const nfeProc = xmlDoc.querySelector('nfeProc');
      return !!nfeProc;
    } catch {
      return false;
    }
  }
}