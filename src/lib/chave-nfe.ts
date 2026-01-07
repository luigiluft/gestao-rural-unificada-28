/**
 * Utilitário para geração automática da Chave de Acesso NF-e (44 dígitos)
 * Seguindo as regras da SEFAZ para modelo 55 (NF-e)
 */

// Tabela de códigos IBGE por UF
export const UF_IBGE: Record<string, string> = {
  'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15',
  'AP': '16', 'TO': '17', 'MA': '21', 'PI': '22', 'CE': '23',
  'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27', 'SE': '28',
  'BA': '29', 'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35',
  'PR': '41', 'SC': '42', 'RS': '43', 'MS': '50', 'MT': '51',
  'GO': '52', 'DF': '53'
}

/**
 * Calcula o Dígito Verificador (DV) usando Módulo 11
 * @param chave43 - Chave com 43 dígitos (sem DV)
 * @returns DV calculado (1 dígito)
 */
function calcularDV(chave43: string): string {
  if (chave43.length !== 43) {
    throw new Error(`Chave deve ter 43 dígitos, recebeu ${chave43.length}`)
  }

  const pesos = [2, 3, 4, 5, 6, 7, 8, 9]
  let soma = 0
  let pesoIndex = 0

  // Multiplica da direita para a esquerda
  for (let i = chave43.length - 1; i >= 0; i--) {
    const digito = parseInt(chave43[i], 10)
    if (isNaN(digito)) {
      throw new Error(`Caractere inválido na posição ${i}: ${chave43[i]}`)
    }
    soma += digito * pesos[pesoIndex]
    pesoIndex = (pesoIndex + 1) % 8
  }

  const resto = soma % 11
  const dv = 11 - resto

  // Se DV >= 10, retorna 0
  return dv >= 10 ? '0' : String(dv)
}

/**
 * Gera um código numérico aleatório de 8 dígitos
 */
function gerarCodigoNumerico(): string {
  const codigo = Math.floor(Math.random() * 100000000)
  return String(codigo).padStart(8, '0')
}

/**
 * Formata número com zeros à esquerda
 */
function padZeros(valor: string | number, tamanho: number): string {
  return String(valor).replace(/\D/g, '').padStart(tamanho, '0').slice(-tamanho)
}

export interface DadosChaveNFe {
  uf: string              // Sigla da UF (ex: 'SP')
  dataEmissao?: Date      // Data de emissão (padrão: hoje)
  cnpj: string            // CNPJ do emitente (só números)
  modelo?: string         // Modelo (padrão: '55' para NF-e)
  serie: string           // Série da NF-e
  numeroNfe: string       // Número da NF-e
  tipoEmissao?: string    // Tipo de emissão (padrão: '1' = Normal)
  codigoNumerico?: string // Código numérico (8 dígitos, gerado se não informado)
}

export interface ResultadoChaveNFe {
  chave: string           // Chave completa (44 dígitos)
  valido: boolean         // Se a chave foi gerada com sucesso
  erro?: string           // Mensagem de erro, se houver
  componentes?: {
    cUF: string
    AAMM: string
    CNPJ: string
    mod: string
    serie: string
    nNF: string
    tpEmis: string
    cNF: string
    dv: string
  }
}

/**
 * Gera a Chave de Acesso NF-e completa (44 dígitos)
 */
export function gerarChaveNFe(dados: DadosChaveNFe): ResultadoChaveNFe {
  try {
    // 1. Validar e obter cUF (2 dígitos)
    const ufUpper = dados.uf?.toUpperCase()
    const cUF = UF_IBGE[ufUpper]
    if (!cUF) {
      return { chave: '', valido: false, erro: `UF inválida: ${dados.uf}` }
    }

    // 2. AAMM - Ano e mês de emissão (4 dígitos)
    const dataEmissao = dados.dataEmissao || new Date()
    const ano = String(dataEmissao.getFullYear()).slice(-2)
    const mes = String(dataEmissao.getMonth() + 1).padStart(2, '0')
    const AAMM = ano + mes

    // 3. CNPJ (14 dígitos)
    const cnpjLimpo = dados.cnpj?.replace(/\D/g, '') || ''
    if (cnpjLimpo.length !== 14) {
      return { chave: '', valido: false, erro: `CNPJ deve ter 14 dígitos, recebeu ${cnpjLimpo.length}` }
    }
    const CNPJ = cnpjLimpo

    // 4. Modelo (2 dígitos) - NF-e = 55
    const mod = dados.modelo || '55'

    // 5. Série (3 dígitos)
    const serieNum = parseInt(dados.serie, 10)
    if (isNaN(serieNum) || serieNum < 0 || serieNum > 999) {
      return { chave: '', valido: false, erro: `Série inválida: ${dados.serie}` }
    }
    const serie = padZeros(dados.serie, 3)

    // 6. Número NF-e (9 dígitos)
    const nfeNum = parseInt(dados.numeroNfe, 10)
    if (isNaN(nfeNum) || nfeNum < 1 || nfeNum > 999999999) {
      return { chave: '', valido: false, erro: `Número NF-e inválido: ${dados.numeroNfe}` }
    }
    const nNF = padZeros(dados.numeroNfe, 9)

    // 7. Tipo de emissão (1 dígito) - 1 = Normal
    const tpEmis = dados.tipoEmissao || '1'
    if (!['1', '2', '3', '4', '5', '6', '7', '9'].includes(tpEmis)) {
      return { chave: '', valido: false, erro: `Tipo de emissão inválido: ${tpEmis}` }
    }

    // 8. Código numérico (8 dígitos)
    const cNF = dados.codigoNumerico 
      ? padZeros(dados.codigoNumerico, 8)
      : gerarCodigoNumerico()

    // Montar chave sem DV (43 dígitos)
    const chave43 = cUF + AAMM + CNPJ + mod + serie + nNF + tpEmis + cNF

    if (chave43.length !== 43) {
      return { 
        chave: '', 
        valido: false, 
        erro: `Chave montada com tamanho incorreto: ${chave43.length} (esperado 43)` 
      }
    }

    // Calcular DV
    const dv = calcularDV(chave43)

    // Chave completa (44 dígitos)
    const chaveCompleta = chave43 + dv

    return {
      chave: chaveCompleta,
      valido: true,
      componentes: {
        cUF,
        AAMM,
        CNPJ,
        mod,
        serie,
        nNF,
        tpEmis,
        cNF,
        dv
      }
    }
  } catch (error) {
    return {
      chave: '',
      valido: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao gerar chave'
    }
  }
}

/**
 * Valida se uma chave NF-e é válida (verifica o DV)
 */
export function validarChaveNFe(chave: string): boolean {
  if (!chave || chave.length !== 44) {
    return false
  }

  const chave43 = chave.slice(0, 43)
  const dvInformado = chave.slice(43)
  const dvCalculado = calcularDV(chave43)

  return dvInformado === dvCalculado
}
