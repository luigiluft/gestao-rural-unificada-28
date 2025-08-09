import { useState } from "react"
import { 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  FileText,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const relatoriosDisponiveis = [
  {
    id: "movimentacao",
    nome: "Relatório de Movimentação",
    descricao: "Entradas e saídas por período",
    tipo: "Operacional",
    ultimaAtualizacao: "2024-08-09"
  },
  {
    id: "estoque",
    nome: "Relatório de Estoque",
    descricao: "Posição atual e histórico de estoque",
    tipo: "Inventário",
    ultimaAtualizacao: "2024-08-09"
  },
  {
    id: "financeiro",
    nome: "Relatório Financeiro",
    descricao: "Valores de entrada e saída",
    tipo: "Financeiro",
    ultimaAtualizacao: "2024-08-08"
  },
  {
    id: "performance",
    nome: "Performance de Fornecedores",
    descricao: "Análise de fornecedores e parceiros",
    tipo: "Análise",
    ultimaAtualizacao: "2024-08-07"
  }
]

const dadosExemplo = [
  { periodo: "Jan/2024", entradas: "R$ 125.450", saidas: "R$ 98.320", saldo: "R$ 27.130", variacao: "+15%" },
  { periodo: "Fev/2024", entradas: "R$ 142.680", saidas: "R$ 108.540", saldo: "R$ 34.140", variacao: "+26%" },
  { periodo: "Mar/2024", entradas: "R$ 158.920", saidas: "R$ 125.780", saldo: "R$ 33.140", variacao: "-3%" },
  { periodo: "Abr/2024", entradas: "R$ 178.450", saidas: "R$ 142.320", saldo: "R$ 36.130", variacao: "+9%" },
  { periodo: "Mai/2024", entradas: "R$ 195.680", saidas: "R$ 165.450", saldo: "R$ 30.230", variacao: "-16%" },
  { periodo: "Jun/2024", entradas: "R$ 212.340", saidas: "R$ 178.920", saldo: "R$ 33.420", variacao: "+11%" }
]

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState("movimentacao")
  const [periodoInicio, setPeriodoInicio] = useState("2024-01-01")
  const [periodoFim, setPeriodoFim] = useState("2024-08-09")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios detalhados sobre suas operações
          </p>
        </div>
      </div>

      {/* Filtros e Configuração */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Configuração do Relatório
          </CardTitle>
          <CardDescription>
            Defina os parâmetros para gerar seu relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movimentacao">Movimentação</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inicio">Data Início</Label>
              <Input 
                id="inicio" 
                type="date" 
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fim">Data Fim</Label>
              <Input 
                id="fim" 
                type="date" 
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ações</Label>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Gerar
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Relatórios */}
        <div className="lg:col-span-1">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
              <CardDescription>
                Modelos pré-configurados para análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatoriosDisponiveis.map((relatorio) => (
                  <div 
                    key={relatorio.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      tipoRelatorio === relatorio.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setTipoRelatorio(relatorio.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{relatorio.nome}</h4>
                      <Badge variant="outline" className="text-xs">
                        {relatorio.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {relatorio.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {new Date(relatorio.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualização do Relatório */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Placeholder */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Visão Geral - {relatoriosDisponiveis.find(r => r.id === tipoRelatorio)?.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">R$ 1.413.520</div>
                  <div className="text-sm text-muted-foreground">Total de Entradas</div>
                  <div className="text-xs text-success">+12% vs período anterior</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg">
                  <div className="text-2xl font-bold text-warning">R$ 1.219.730</div>
                  <div className="text-sm text-muted-foreground">Total de Saídas</div>
                  <div className="text-xs text-success">+8% vs período anterior</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg">
                  <div className="text-2xl font-bold text-success">R$ 193.790</div>
                  <div className="text-sm text-muted-foreground">Saldo Líquido</div>
                  <div className="text-xs text-success">+28% vs período anterior</div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Gráfico de Movimentação por Período</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dados atualizados em tempo real
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Dados */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Dados Detalhados
                </span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosExemplo.map((linha, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{linha.periodo}</TableCell>
                      <TableCell className="text-success">{linha.entradas}</TableCell>
                      <TableCell className="text-warning">{linha.saidas}</TableCell>
                      <TableCell className="font-medium">{linha.saldo}</TableCell>
                      <TableCell>
                        <span className={linha.variacao.startsWith('+') ? 'text-success' : 'text-destructive'}>
                          {linha.variacao}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Insights e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <h4 className="font-medium text-success">📈 Crescimento Consistente</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    As entradas cresceram 12% no período, indicando expansão saudável das operações.
                  </p>
                </div>
                
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <h4 className="font-medium text-warning">⚠️ Atenção ao Estoque</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    3 produtos com estoque abaixo do mínimo. Considere reabastecer para evitar perdas.
                  </p>
                </div>
                
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary">💡 Oportunidade</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maio apresentou maior eficiência na relação entrada/saída. Analise os fatores.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}