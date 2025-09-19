import { useState } from "react"
import { Calculator, Plus, Search, Edit, Trash2, Download, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TabelasFrete() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")

  // Mock data para tabelas de frete
  const tabelasFrete = [
    {
      id: "TAB-001",
      nome: "Tabela Regional SP",
      tipo: "distancia",
      origem: "São Paulo - SP",
      ativo: true,
      dataVigencia: "2024-01-01",
      dataVencimento: "2024-12-31",
      valorBase: 2.50,
      unidade: "km",
      regras: [
        { faixa: "0-50km", valor: 3.00, unidade: "km" },
        { faixa: "51-100km", valor: 2.80, unidade: "km" },
        { faixa: "101-200km", valor: 2.50, unidade: "km" },
        { faixa: "201km+", valor: 2.20, unidade: "km" }
      ]
    },
    {
      id: "TAB-002", 
      nome: "Tabela Peso/Volume",
      tipo: "peso",
      origem: "Centro de Distribuição",
      ativo: true,
      dataVigencia: "2024-01-01",
      dataVencimento: "2024-12-31",
      valorBase: 0.80,
      unidade: "kg",
      regras: [
        { faixa: "0-1000kg", valor: 1.20, unidade: "kg" },
        { faixa: "1001-5000kg", valor: 0.90, unidade: "kg" },
        { faixa: "5001-10000kg", valor: 0.70, unidade: "kg" },
        { faixa: "10001kg+", valor: 0.50, unidade: "kg" }
      ]
    },
    {
      id: "TAB-003",
      nome: "Tabela Expressa",
      tipo: "fixo",
      origem: "São Paulo - SP", 
      ativo: false,
      dataVigencia: "2023-06-01",
      dataVencimento: "2023-12-31",
      valorBase: 150.00,
      unidade: "entrega",
      regras: [
        { faixa: "Entrega mesmo dia", valor: 200.00, unidade: "entrega" },
        { faixa: "Entrega 24h", valor: 150.00, unidade: "entrega" },
        { faixa: "Entrega 48h", valor: 100.00, unidade: "entrega" }
      ]
    }
  ]

  // Mock data para transportadoras
  const transportadoras = [
    {
      id: "TRANS-001",
      nome: "Transportadora ABC",
      cnpj: "12.345.678/0001-90",
      contato: "(11) 99999-1234",
      email: "contato@transportadoraabc.com",
      especialidade: "Cargas secas",
      regiaoAtendimento: "SP, MG, RJ",
      valorKm: 2.80,
      valorMinimo: 150.00,
      ativo: true
    },
    {
      id: "TRANS-002",
      nome: "Logística XYZ",
      cnpj: "98.765.432/0001-10",
      contato: "(11) 88888-5678",
      email: "comercial@logisticaxyz.com",
      especialidade: "Produtos químicos",
      regiaoAtendimento: "SP, PR, SC",
      valorKm: 3.20,
      valorMinimo: 200.00,
      ativo: true
    }
  ]

  const tiposBadge = {
    distancia: { label: "Por Distância", variant: "default" as const },
    peso: { label: "Por Peso", variant: "secondary" as const },
    fixo: { label: "Valor Fixo", variant: "outline" as const }
  }

  const filteredTabelas = tabelasFrete.filter(tabela => {
    const matchesSearch = tabela.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tabela.origem.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === "all" || tabela.tipo === tipoFilter
    return matchesSearch && matchesTipo
  })

  const calcularFrete = (distancia: number, peso: number, tabela: any) => {
    if (tabela.tipo === "distancia") {
      let valor = tabela.valorBase
      if (distancia <= 50) valor = 3.00
      else if (distancia <= 100) valor = 2.80
      else if (distancia <= 200) valor = 2.50
      else valor = 2.20
      return distancia * valor
    } else if (tabela.tipo === "peso") {
      let valor = tabela.valorBase
      if (peso <= 1000) valor = 1.20
      else if (peso <= 5000) valor = 0.90
      else if (peso <= 10000) valor = 0.70
      else valor = 0.50
      return peso * valor
    } else {
      return tabela.valorBase
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Tabelas de Frete
          </h1>
          <p className="text-muted-foreground">
            Gestão de custos e preços de transporte
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tabela
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Tabela de Frete</DialogTitle>
                <DialogDescription>
                  Configure uma nova tabela de preços para frete
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Tabela</label>
                    <Input placeholder="Ex: Tabela Regional SP" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo de Cálculo</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distancia">Por Distância</SelectItem>
                        <SelectItem value="peso">Por Peso</SelectItem>
                        <SelectItem value="fixo">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Origem</label>
                    <Input placeholder="Local de origem" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor Base</label>
                    <Input placeholder="0,00" type="number" step="0.01" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data de Vigência</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data de Vencimento</label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Criar Tabela</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="tabelas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tabelas">Tabelas de Frete</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora</TabsTrigger>
          <TabsTrigger value="transportadoras">Transportadoras</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="tabelas">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome ou origem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="distancia">Por Distância</SelectItem>
                    <SelectItem value="peso">Por Peso</SelectItem>
                    <SelectItem value="fixo">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Tabelas */}
          <Card>
            <CardHeader>
              <CardTitle>Tabelas de Frete Cadastradas</CardTitle>
              <CardDescription>
                Gerencie as tabelas de preço para cálculo de frete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTabelas.length === 0 ? (
                <EmptyState
                  icon={<Calculator className="h-8 w-8" />}
                  title="Nenhuma tabela encontrada"
                  description="Não há tabelas que correspondem aos filtros selecionados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Valor Base</TableHead>
                      <TableHead>Vigência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTabelas.map((tabela) => (
                      <TableRow key={tabela.id}>
                        <TableCell className="font-medium">{tabela.nome}</TableCell>
                        <TableCell>
                          <Badge variant={tiposBadge[tabela.tipo as keyof typeof tiposBadge].variant}>
                            {tiposBadge[tabela.tipo as keyof typeof tiposBadge].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{tabela.origem}</TableCell>
                        <TableCell>R$ {tabela.valorBase.toFixed(2)}/{tabela.unidade}</TableCell>
                        <TableCell>
                          {new Date(tabela.dataVigencia).toLocaleDateString()} até{' '}
                          {new Date(tabela.dataVencimento).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tabela.ativo ? "default" : "secondary"}>
                            {tabela.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Detalhes da Tabela - {tabela.nome}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <strong>Tipo:</strong> {tiposBadge[tabela.tipo as keyof typeof tiposBadge].label}
                                    </div>
                                    <div>
                                      <strong>Origem:</strong> {tabela.origem}
                                    </div>
                                    <div>
                                      <strong>Valor Base:</strong> R$ {tabela.valorBase.toFixed(2)}/{tabela.unidade}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Regras de Cálculo</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Faixa</TableHead>
                                          <TableHead>Valor</TableHead>
                                          <TableHead>Unidade</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {tabela.regras.map((regra, index) => (
                                          <TableRow key={index}>
                                            <TableCell>{regra.faixa}</TableCell>
                                            <TableCell>R$ {regra.valor.toFixed(2)}</TableCell>
                                            <TableCell>{regra.unidade}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculadora">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Frete</CardTitle>
              <CardDescription>
                Calcule o valor do frete com base nas tabelas cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tabela de Frete</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tabela" />
                    </SelectTrigger>
                    <SelectContent>
                      {tabelasFrete.filter(t => t.ativo).map(tabela => (
                        <SelectItem key={tabela.id} value={tabela.id}>
                          {tabela.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Distância (km)</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Peso (kg)</label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resultado do Cálculo</h4>
                <div className="text-2xl font-bold text-primary">R$ 0,00</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Insira os dados acima para calcular o frete
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Detalhamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor base:</span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa por km:</span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa por peso:</span>
                      <span>R$ 0,00</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>R$ 0,00</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Histórico de Cálculos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Nenhum cálculo realizado ainda
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transportadoras">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transportadoras Parceiras</CardTitle>
                  <CardDescription>
                    Gerencie as transportadoras e seus preços
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transportadora
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead>Valor/km</TableHead>
                    <TableHead>Valor Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportadoras.map((transportadora) => (
                    <TableRow key={transportadora.id}>
                      <TableCell className="font-medium">{transportadora.nome}</TableCell>
                      <TableCell>{transportadora.cnpj}</TableCell>
                      <TableCell>{transportadora.especialidade}</TableCell>
                      <TableCell>{transportadora.regiaoAtendimento}</TableCell>
                      <TableCell>R$ {transportadora.valorKm.toFixed(2)}</TableCell>
                      <TableCell>R$ {transportadora.valorMinimo.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={transportadora.ativo ? "default" : "secondary"}>
                          {transportadora.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos de Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">R$ 15.250,00</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total gasto este mês
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rentabilidade por Rota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rota Norte</span>
                    <span className="font-medium">+15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rota Sul</span>
                    <span className="font-medium">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rota Leste</span>
                    <span className="font-medium">+12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}