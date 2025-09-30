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

      // Extrair valor total
      const total = xmlDoc.querySelector('ICMSTot');
      const valorTotal = parseFloat(total?.querySelector('vNF')?.textContent || '0');

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
        versao_processo
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