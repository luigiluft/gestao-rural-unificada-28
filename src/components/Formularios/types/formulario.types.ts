export type FormularioTipo = 'entrada' | 'saida'

export interface ItemGenerico {
  // Campos comuns
  produto: string
  produto_id?: string
  produtoNome?: string
  lote: string
  lote_id?: string
  quantidade: number
  unidade: string
  valorUnitario: number
  valorTotal: number
  deposito?: string
  observacoes?: string
  
  // Campos específicos de entrada
  codigo?: string
  codigoEAN?: string
  dataValidade?: string
  quantidadeLote?: number
  dataFabricacao?: string
  
  // Campos tributários (entrada)
  descricao_produto?: string
  ncm?: string
  cest?: string
  cfop?: string
  quantidade_comercial?: number
  valor_unitario_comercial?: number
  codigo_ean_tributavel?: string
  unidade_tributavel?: string
  quantidade_tributavel?: number
  valor_unitario_tributavel?: number
  indicador_total?: string
  impostos_icms?: any
  impostos_ipi?: any
  impostos_pis?: any
  impostos_cofins?: any
  valor_total_tributos_item?: number
  
  // Campos específicos de saída
  valor_unitario?: number
  valor_total?: number
}

export interface DadosGenericosBase {
  observacoes: string
  depositoId: string
}

export interface DadosEntrada extends DadosGenericosBase {
  numeroNF: string
  serie: string
  chaveNFe: string
  naturezaOperacao: string
  dataEntrada: string
  dataEmissao: string
  origem: string
  // Dados completos da NFe para submissão backend
  nfeData?: {
    numero_nfe?: string
    serie?: string
    chave_nfe?: string
    data_emissao?: string
    valor_total?: number
    emitente_cnpj?: string
    emitente_nome?: string
    emitente_endereco?: string
    destinatario_cpf_cnpj?: string
    destinatario_nome?: string
    entrega_cnpj?: string
    entrega_nome?: string
    xml_content?: string
  }
}

export interface DadosSaida extends DadosGenericosBase {
  data_saida: string
  tipo_saida: string
  produtor_destinatario: string
  fazenda_id: string
  placa_veiculo: string
  nome_motorista: string
  telefone_motorista: string
  cpf_motorista: string
  mopp_motorista: string
  janela_horario: string
  janela_entrega_dias?: number
  frete_origem?: string
  frete_destino?: string
  frete_distancia?: number
  valor_frete_calculado?: number
  prazo_entrega_calculado?: number
  // Campos de operação fiscal
  finalidade_nfe?: 'normal' | 'devolucao' | 'remessa' | 'complementar'
  nfe_referenciada_chave?: string
  nfe_referenciada_data?: string
  cfop?: string
  gera_financeiro?: boolean
  movimenta_estoque?: 'saida' | 'entrada' | 'nao_movimenta'
  tipo_complemento?: 'valor' | 'quantidade' | 'imposto' | ''
}

export interface FormularioGenericoProps {
  tipo: FormularioTipo
  onSubmit: (dados: any) => void
  onCancel: () => void
  // Props específicas para entrada
  nfData?: any
}

export interface UseFormularioLogicProps {
  tipo: FormularioTipo
  nfData?: any
}

export interface UseFormularioValidationProps {
  tipo: FormularioTipo
  dados: DadosEntrada | DadosSaida
  itens: ItemGenerico[]
}