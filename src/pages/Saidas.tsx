import { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Package,
  Truck,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const saidas = [
  {
    id: "SAI001",
    produto: "Milho Híbrido",
    lote: "MIL001",
    quantidade: 200,
    unidade: "sacas",
    deposito: "Armazém A",
    data: "2024-08-09",
    destino: "Cliente Premium Ltda",
    tipo: "Venda",
    status: "Expedida",
    valor: "R$ 18.000,00",
    transportadora: "Transportes ABC"
  },
  {
    id: "SAI002",
    produto: "Fertilizante NPK",
    lote: "NPK123",
    quantidade: 500,
    unidade: "kg",
    deposito: "Armazém B",
    data: "2024-08-08",
    destino: "Fazenda Vista Alegre",
    tipo: "Transferência",
    status: "Preparando",
    valor: "R$ 2.125,00",
    transportadora: "Retirada Própria"
  },
  {
    id: "SAI003",
    produto: "Soja Premium",
    lote: "SOJ045",
    quantidade: 150,
    unidade: "sacas",
    deposito: "Armazém A",
    data: "2024-08-07",
    destino: "Cooperativa XYZ",
    tipo: "Venda",
    status: "Entregue",
    valor: "R$ 26.400,00",
    transportadora: "Logística Rural"
  }
]

export default function Saidas() {
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Entregue":
        return "default"
      case "Expedida":
        return "secondary"
      case "Preparando":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saídas</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as saídas de produtos do estoque
          </p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isNewSaidaOpen} onOpenChange={setIsNewSaidaOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Saída</DialogTitle>
                <DialogDescription>
                  Preencha os dados da saída de produtos do estoque
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milho">Milho Híbrido - MIL001 (450 sacas)</SelectItem>
                        <SelectItem value="soja">Soja Premium - SOJ045 (800 sacas)</SelectItem>
                        <SelectItem value="fertilizante">Fertilizante NPK - NPK123 (50 kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Saída</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="uso-interno">Uso Interno</SelectItem>
                        <SelectItem value="perda">Perda/Descarte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input id="quantidade" type="number" placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sacas">Sacas</SelectItem>
                        <SelectItem value="kg">Quilogramas</SelectItem>
                        <SelectItem value="litros">Litros</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposito">Depósito Origem</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Depósito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="armazem-a">Armazém A</SelectItem>
                        <SelectItem value="armazem-b">Armazém B</SelectItem>
                        <SelectItem value="deposito-campo">Depósito Campo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data da Saída</Label>
                    <Input id="data" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino</Label>
                    <Input id="destino" placeholder="Ex: Cliente Premium Ltda" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entrega">Tipo de Entrega</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Como será a entrega?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retirada">Retirada no Local</SelectItem>
                      <SelectItem value="entrega">Entrega por Transportadora</SelectItem>
                      <SelectItem value="transfer">Transferência Interna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    placeholder="Observações adicionais sobre a saída..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsNewSaidaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsNewSaidaOpen(false)}>
                  Registrar Saída
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saídas Hoje</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Preparação</p>
                <p className="text-2xl font-bold text-warning">5</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Package className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expedidas</p>
                <p className="text-2xl font-bold text-secondary-foreground">8</p>
              </div>
              <div className="p-2 bg-secondary rounded-lg">
                <Truck className="w-5 h-5 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold text-success">28</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <Package className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, destino ou lote..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Período
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saidas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Saídas</CardTitle>
          <CardDescription>
            {saidas.length} saídas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saidas.map((saida) => (
                <TableRow key={saida.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{saida.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      {saida.produto}
                    </div>
                  </TableCell>
                  <TableCell>{saida.lote}</TableCell>
                  <TableCell>{saida.quantidade} {saida.unidade}</TableCell>
                  <TableCell>{saida.deposito}</TableCell>
                  <TableCell>{new Date(saida.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{saida.destino}</p>
                      <p className="text-xs text-muted-foreground">{saida.transportadora}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{saida.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(saida.status) as any}>
                      {saida.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{saida.valor}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}