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