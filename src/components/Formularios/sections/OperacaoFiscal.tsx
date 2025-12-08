import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, AlertTriangle, FileText } from "lucide-react"
import { DadosSaida } from "../types/formulario.types"

interface OperacaoFiscalProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

const FINALIDADES = [
  { 
    value: 'normal', 
    label: 'NF-e Normal (Venda Padrão)',
    finNFe: 1,
    description: 'Venda padrão com movimentação de estoque e geração financeira'
  },
  { 
    value: 'devolucao', 
    label: 'NF-e de Devolução',
    finNFe: 4,
    description: 'Devolução de mercadoria - retorna estoque e NÃO gera cobrança'
  },
  { 
    value: 'remessa', 
    label: 'Remessa de Produto',
    finNFe: 1,
    description: 'Remessa sem receita - apenas transfere fisicamente o produto'
  },
  { 
    value: 'complementar', 
    label: 'NF-e Complementar ou de Ajuste',
    finNFe: 2,
    description: 'Correção de valor, peso ou imposto - NÃO movimenta estoque'
  }
]

const TIPOS_COMPLEMENTO = [
  { value: 'valor', label: 'Valor' },
  { value: 'quantidade', label: 'Quantidade' },
  { value: 'imposto', label: 'Imposto' }
]

export function OperacaoFiscalSection({ dados, onDadosChange }: OperacaoFiscalProps) {
  const finalidadeSelecionada = FINALIDADES.find(f => f.value === dados.finalidade_nfe)
  const requerNFeReferenciada = dados.finalidade_nfe === 'devolucao' || dados.finalidade_nfe === 'complementar'

  const handleFinalidadeChange = (value: string) => {
    // Definir valores padrão baseados na finalidade
    let geraFinanceiro = true
    let movimentaEstoque: 'saida' | 'entrada' | 'nao_movimenta' = 'saida'
    
    switch (value) {
      case 'normal':
        geraFinanceiro = true
        movimentaEstoque = 'saida'
        break
      case 'devolucao':
        geraFinanceiro = false
        movimentaEstoque = 'entrada'
        break
      case 'remessa':
        geraFinanceiro = false
        movimentaEstoque = 'saida'
        break
      case 'complementar':
        geraFinanceiro = true
        movimentaEstoque = 'nao_movimenta'
        break
    }
    
    onDadosChange({
      ...dados,
      finalidade_nfe: value as DadosSaida['finalidade_nfe'],
      gera_financeiro: geraFinanceiro,
      movimenta_estoque: movimentaEstoque,
      // Limpar campos de NF referenciada se não for necessário
      nfe_referenciada_chave: (value === 'devolucao' || value === 'complementar') ? dados.nfe_referenciada_chave : '',
      nfe_referenciada_data: (value === 'devolucao' || value === 'complementar') ? dados.nfe_referenciada_data : '',
      tipo_complemento: value === 'complementar' ? dados.tipo_complemento : ''
    })
  }

  const getAlertVariant = () => {
    switch (dados.finalidade_nfe) {
      case 'devolucao':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
      case 'remessa':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
      case 'complementar':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
      default:
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Operação Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Finalidade */}
        <div className="space-y-2">
          <Label htmlFor="finalidade_nfe">Tipo de Operação *</Label>
          <Select
            value={dados.finalidade_nfe || 'normal'}
            onValueChange={handleFinalidadeChange}
          >
            <SelectTrigger id="finalidade_nfe">
              <SelectValue placeholder="Selecione o tipo de operação" />
            </SelectTrigger>
            <SelectContent>
              {FINALIDADES.map(finalidade => (
                <SelectItem key={finalidade.value} value={finalidade.value}>
                  {finalidade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alert Informativo */}
        {finalidadeSelecionada && (
          <Alert className={getAlertVariant()}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>finNFe: {finalidadeSelecionada.finNFe}</strong> - {finalidadeSelecionada.description}
              <div className="mt-2 text-sm opacity-80">
                <span className="font-medium">Estoque:</span> {dados.movimenta_estoque === 'saida' ? 'Saída' : dados.movimenta_estoque === 'entrada' ? 'Entrada' : 'Não movimenta'} | 
                <span className="font-medium ml-2">Financeiro:</span> {dados.gera_financeiro ? 'Gera cobrança' : 'Não gera'}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Campos condicionais para NF referenciada */}
        {requerNFeReferenciada && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Dados da NF-e Referenciada (Obrigatório)</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nfe_referenciada_chave">Chave da NF-e Original (44 dígitos) *</Label>
                <Input
                  id="nfe_referenciada_chave"
                  value={dados.nfe_referenciada_chave || ''}
                  onChange={(e) => onDadosChange({ ...dados, nfe_referenciada_chave: e.target.value })}
                  placeholder="00000000000000000000000000000000000000000000"
                  maxLength={44}
                />
                {dados.nfe_referenciada_chave && dados.nfe_referenciada_chave.length !== 44 && (
                  <p className="text-xs text-destructive">
                    A chave deve ter exatamente 44 dígitos ({dados.nfe_referenciada_chave.length}/44)
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nfe_referenciada_data">Data da NF-e Original</Label>
                <Input
                  id="nfe_referenciada_data"
                  type="date"
                  value={dados.nfe_referenciada_data || ''}
                  onChange={(e) => onDadosChange({ ...dados, nfe_referenciada_data: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tipo de complemento */}
        {dados.finalidade_nfe === 'complementar' && (
          <div className="space-y-2">
            <Label htmlFor="tipo_complemento">Tipo de Complemento *</Label>
            <Select
              value={dados.tipo_complemento || ''}
              onValueChange={(value) => onDadosChange({ ...dados, tipo_complemento: value as DadosSaida['tipo_complemento'] })}
            >
              <SelectTrigger id="tipo_complemento">
                <SelectValue placeholder="Selecione o tipo de complemento" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_COMPLEMENTO.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campo CFOP */}
        <div className="space-y-2">
          <Label htmlFor="cfop">CFOP</Label>
          <Input
            id="cfop"
            value={dados.cfop || ''}
            onChange={(e) => onDadosChange({ ...dados, cfop: e.target.value })}
            placeholder="Ex: 5102, 5202, 5901"
            maxLength={4}
          />
          <p className="text-xs text-muted-foreground">
            Código Fiscal de Operações e Prestações
          </p>
        </div>
      </CardContent>
    </Card>
  )
}