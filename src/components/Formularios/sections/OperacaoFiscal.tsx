import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Info, AlertTriangle, FileText, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
    value: 'transferencia', 
    label: 'Transferência entre Estabelecimentos',
    finNFe: 1,
    description: 'Transferência interna (matriz/filiais) - NÃO gera financeiro'
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

// CFOPs sugeridos por tipo de operação
const CFOPS_POR_FINALIDADE: Record<string, Array<{ code: string; description: string }>> = {
  normal: [
    { code: '5102', description: 'Venda de mercadoria (dentro do estado)' },
    { code: '6102', description: 'Venda de mercadoria (fora do estado)' },
    { code: '5101', description: 'Venda de produção própria (dentro do estado)' },
    { code: '6101', description: 'Venda de produção própria (fora do estado)' },
    { code: '5405', description: 'Venda com ST já recolhido (dentro do estado)' },
    { code: '6404', description: 'Venda com ST já recolhido (fora do estado)' },
  ],
  devolucao: [
    { code: '5202', description: 'Devolução de compra (dentro do estado)' },
    { code: '6202', description: 'Devolução de compra (fora do estado)' },
    { code: '5411', description: 'Devolução com ST (dentro do estado)' },
    { code: '6411', description: 'Devolução com ST (fora do estado)' },
    { code: '5210', description: 'Devolução de industrialização (dentro do estado)' },
    { code: '6210', description: 'Devolução de industrialização (fora do estado)' },
  ],
  remessa: [
    { code: '5901', description: 'Remessa para industrialização (dentro do estado)' },
    { code: '6901', description: 'Remessa para industrialização (fora do estado)' },
    { code: '5902', description: 'Retorno de industrialização (dentro do estado)' },
    { code: '6902', description: 'Retorno de industrialização (fora do estado)' },
    { code: '5905', description: 'Remessa para depósito fechado (dentro do estado)' },
    { code: '6905', description: 'Remessa para depósito fechado (fora do estado)' },
    { code: '5906', description: 'Retorno de depósito fechado (dentro do estado)' },
    { code: '6906', description: 'Retorno de depósito fechado (fora do estado)' },
    { code: '5907', description: 'Retorno simbólico (dentro do estado)' },
    { code: '6907', description: 'Retorno simbólico (fora do estado)' },
    { code: '5908', description: 'Remessa de bem por conta de contrato (dentro do estado)' },
    { code: '5910', description: 'Remessa em bonificação (dentro do estado)' },
    { code: '6910', description: 'Remessa em bonificação (fora do estado)' },
    { code: '5911', description: 'Remessa de amostra grátis (dentro do estado)' },
    { code: '6911', description: 'Remessa de amostra grátis (fora do estado)' },
    { code: '5912', description: 'Remessa de demonstração (dentro do estado)' },
    { code: '6912', description: 'Remessa de demonstração (fora do estado)' },
    { code: '5913', description: 'Retorno de demonstração (dentro do estado)' },
    { code: '6913', description: 'Retorno de demonstração (fora do estado)' },
    { code: '5914', description: 'Remessa para conserto (dentro do estado)' },
    { code: '6914', description: 'Remessa para conserto (fora do estado)' },
    { code: '5915', description: 'Retorno de conserto (dentro do estado)' },
    { code: '6915', description: 'Retorno de conserto (fora do estado)' },
    { code: '5923', description: 'Remessa de mercadoria para armazém geral (dentro do estado)' },
    { code: '6923', description: 'Remessa de mercadoria para armazém geral (fora do estado)' },
    { code: '5934', description: 'Remessa simbólica de mercadoria depositada em armazém geral (dentro do estado)' },
    { code: '5949', description: 'Outra saída não especificada (dentro do estado)' },
    { code: '6949', description: 'Outra saída não especificada (fora do estado)' },
  ],
  transferencia: [
    { code: '5151', description: 'Transferência de produção própria (dentro do estado)' },
    { code: '6151', description: 'Transferência de produção própria (fora do estado)' },
    { code: '5152', description: 'Transferência de mercadoria adquirida (dentro do estado)' },
    { code: '6152', description: 'Transferência de mercadoria adquirida (fora do estado)' },
  ],
  complementar: [
    { code: '5102', description: 'Complemento de valor (dentro do estado)' },
    { code: '6102', description: 'Complemento de valor (fora do estado)' },
    { code: '5949', description: 'Complemento não especificado (dentro do estado)' },
    { code: '6949', description: 'Complemento não especificado (fora do estado)' },
  ]
}

export function OperacaoFiscalSection({ dados, onDadosChange }: OperacaoFiscalProps) {
  const [cfopOpen, setCfopOpen] = useState(false)
  const [cfopSearch, setCfopSearch] = useState('')
  
  const finalidadeSelecionada = FINALIDADES.find(f => f.value === dados.finalidade_nfe)
  const requerNFeReferenciada = dados.finalidade_nfe === 'devolucao' || dados.finalidade_nfe === 'complementar'
  
  const cfopsSugeridos = CFOPS_POR_FINALIDADE[dados.finalidade_nfe || 'normal'] || []
  
  // Filter CFOPs based on search
  const cfopsFiltrados = cfopsSugeridos.filter(cfop => 
    cfop.code.includes(cfopSearch) || 
    cfop.description.toLowerCase().includes(cfopSearch.toLowerCase())
  )

  const handleFinalidadeChange = (value: string) => {
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
      case 'transferencia':
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
      nfe_referenciada_chave: (value === 'devolucao' || value === 'complementar') ? dados.nfe_referenciada_chave : '',
      nfe_referenciada_data: (value === 'devolucao' || value === 'complementar') ? dados.nfe_referenciada_data : '',
      tipo_complemento: value === 'complementar' ? dados.tipo_complemento : '',
      destinatario_transferencia_id: value === 'transferencia' ? dados.destinatario_transferencia_id : undefined,
      cfop: '' // Reset CFOP when changing operation type
    })
  }

  const handleCfopSelect = (cfopCode: string) => {
    onDadosChange({ ...dados, cfop: cfopCode })
    setCfopOpen(false)
    setCfopSearch('')
  }

  const getAlertVariant = () => {
    switch (dados.finalidade_nfe) {
      case 'devolucao':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
      case 'remessa':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
      case 'transferencia':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800'
      case 'complementar':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
      default:
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
    }
  }

  const selectedCfopDescription = cfopsSugeridos.find(c => c.code === dados.cfop)?.description

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

        {/* Campo CFOP com Combobox */}
        <div className="space-y-2">
          <Label htmlFor="cfop">CFOP</Label>
          <Popover open={cfopOpen} onOpenChange={setCfopOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cfopOpen}
                className="w-full justify-between font-normal"
              >
                {dados.cfop ? (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{dados.cfop}</span>
                    {selectedCfopDescription && (
                      <span className="text-muted-foreground truncate">- {selectedCfopDescription}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione ou digite um CFOP...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
              <Command>
                <CommandInput 
                  placeholder="Buscar ou digitar CFOP..." 
                  value={cfopSearch}
                  onValueChange={setCfopSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {cfopSearch.length > 0 && /^\d{4}$/.test(cfopSearch) ? (
                      <div 
                        className="py-3 px-4 text-sm cursor-pointer hover:bg-accent"
                        onClick={() => handleCfopSelect(cfopSearch)}
                      >
                        Usar CFOP personalizado: <strong>{cfopSearch}</strong>
                      </div>
                    ) : (
                      <div className="py-3 px-4 text-sm text-muted-foreground">
                        {cfopSearch.length > 0 
                          ? 'Digite 4 dígitos para usar um CFOP personalizado'
                          : 'Nenhum CFOP encontrado'
                        }
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="CFOPs sugeridos para esta operação">
                    {cfopsFiltrados.map(cfop => (
                      <CommandItem
                        key={cfop.code}
                        value={`${cfop.code} ${cfop.description}`}
                        onSelect={() => handleCfopSelect(cfop.code)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            dados.cfop === cfop.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium mr-2">{cfop.code}</span>
                        <span className="text-muted-foreground text-sm truncate">{cfop.description}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Código Fiscal de Operações e Prestações - selecione da lista ou digite manualmente
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
