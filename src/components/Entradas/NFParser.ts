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
  };
  destinatario: {
    cpfCnpj: string;
    nome: string;
    endereco: string;
  };
  entrega?: {
    cnpj: string;
    ie?: string;
    endereco: string;
  };
  destinatarioCpfCnpj: string;
  itens: NFItem[];
  valorTotal: number;
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

      // Extrair dados básicos da NFe
      const ide = xmlDoc.querySelector('ide');
      const numeroNF = ide?.querySelector('nNF')?.textContent || '';
      const serie = ide?.querySelector('serie')?.textContent || '';
      const naturezaOperacao = ide?.querySelector('natOp')?.textContent || '';
      const dataEmissao = ide?.querySelector('dhEmi')?.textContent?.split('T')[0] || '';

      // Extrair dados do emitente
      const emit = xmlDoc.querySelector('emit');
      const emitente = {
        cnpj: emit?.querySelector('CNPJ')?.textContent || '',
        nome: emit?.querySelector('xNome')?.textContent || '',
        nomeFantasia: emit?.querySelector('xFant')?.textContent || undefined,
        endereco: this.formatarEndereco(emit?.querySelector('enderEmit'))
      };

      // Extrair dados do destinatário
      const dest = xmlDoc.querySelector('dest');
      const destinatarioCpfCnpj = dest?.querySelector('CNPJ')?.textContent || dest?.querySelector('CPF')?.textContent || '';
      const destinatario = {
        cpfCnpj: destinatarioCpfCnpj,
        nome: dest?.querySelector('xNome')?.textContent || '',
        endereco: this.formatarEndereco(dest?.querySelector('enderDest'))
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
            endereco: this.formatarEnderecoEntrega(entrega)
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
        valorTotal
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