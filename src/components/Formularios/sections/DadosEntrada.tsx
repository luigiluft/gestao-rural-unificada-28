import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SeletorDeposito } from "@/components/Entradas/SeletorDeposito"
import { DadosEntrada } from "../types/formulario.types"

interface DadosEntradaProps {
  dados: DadosEntrada
  onDadosChange: (dados: DadosEntrada) => void
  nfData?: any
  isTutorialActive?: boolean
}

export function DadosEntradaSection({ dados, onDadosChange, nfData, isTutorialActive }: DadosEntradaProps) {
  const handleChange = (campo: keyof DadosEntrada, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Dados da Entrada
          {nfData && <Badge variant="secondary">Importado da NFe</Badge>}
          {isTutorialActive && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Tutorial - Dados de Exemplo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numeroNF">Número da NF</Label>
            <Input
              id="numeroNF"
              data-tutorial="numero-nf"
              value={dados.numeroNF}
              onChange={(e) => handleChange('numeroNF', e.target.value)}
              placeholder="Ex: 123456"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serie">Série</Label>
            <Input
              id="serie"
              value={dados.serie}
              onChange={(e) => handleChange('serie', e.target.value)}
              placeholder="Ex: 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataEntrada">Data da Entrada</Label>
            <Input
              id="dataEntrada"
              type="date"
              value={dados.dataEntrada}
              onChange={(e) => handleChange('dataEntrada', e.target.value)}
            />
          </div>
        </div>
        
        {nfData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chaveNFe">Chave da NFe</Label>
              <Input
                id="chaveNFe"
                value={dados.chaveNFe}
                onChange={(e) => handleChange('chaveNFe', e.target.value)}
                placeholder="Chave de 44 dígitos"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="naturezaOperacao">Natureza da Operação</Label>
              <Input
                id="naturezaOperacao"
                value={dados.naturezaOperacao}
                onChange={(e) => handleChange('naturezaOperacao', e.target.value)}
                placeholder="Ex: Venda de Mercadoria"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origem">Origem/Fornecedor</Label>
            <Input
              id="origem"
              value={dados.origem}
              onChange={(e) => handleChange('origem', e.target.value)}
              placeholder="Ex: Cooperativa ABC"
            />
          </div>

          <SeletorDeposito
            value={dados.depositoId}
            onValueChange={(value) => handleChange('depositoId', value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={dados.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            placeholder="Observações gerais sobre a entrada..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}