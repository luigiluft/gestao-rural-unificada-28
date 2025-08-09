// Parser para XML de Nota Fiscal Eletrônica
export interface NFItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface NFData {
  numeroNF: string;
  serie: string;
  dataEmissao: string;
  emitente: {
    cnpj: string;
    nome: string;
    endereco: string;
  };
  destinatario: {
    cpfCnpj: string;
    nome: string;
    endereco: string;
  };
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

      // Extrair dados básicos da NFe
      const ide = xmlDoc.querySelector('ide');
      const numeroNF = ide?.querySelector('nNF')?.textContent || '';
      const serie = ide?.querySelector('serie')?.textContent || '';
      const dataEmissao = ide?.querySelector('dhEmi')?.textContent?.split('T')[0] || '';

      // Extrair dados do emitente
      const emit = xmlDoc.querySelector('emit');
      const emitente = {
        cnpj: emit?.querySelector('CNPJ')?.textContent || '',
        nome: emit?.querySelector('xNome')?.textContent || '',
        endereco: this.formatarEndereco(emit?.querySelector('enderEmit'))
      };

      // Extrair dados do destinatário
      const dest = xmlDoc.querySelector('dest');
      const destinatario = {
        cpfCnpj: dest?.querySelector('CNPJ')?.textContent || dest?.querySelector('CPF')?.textContent || '',
        nome: dest?.querySelector('xNome')?.textContent || '',
        endereco: this.formatarEndereco(dest?.querySelector('enderDest'))
      };

      // Extrair itens
      const detElements = xmlDoc.querySelectorAll('det');
      const itens: NFItem[] = [];
      
      detElements.forEach(det => {
        const prod = det.querySelector('prod');
        if (prod) {
          const item: NFItem = {
            codigo: prod.querySelector('cProd')?.textContent || '',
            descricao: prod.querySelector('xProd')?.textContent || '',
            quantidade: parseFloat(prod.querySelector('qCom')?.textContent || '0'),
            unidade: prod.querySelector('uCom')?.textContent || '',
            valorUnitario: parseFloat(prod.querySelector('vUnCom')?.textContent || '0'),
            valorTotal: parseFloat(prod.querySelector('vProd')?.textContent || '0')
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
        dataEmissao,
        emitente,
        destinatario,
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