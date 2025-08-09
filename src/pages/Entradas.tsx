import { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Package,
  Upload,
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

const entradas = [
  {
    id: "ENT001",
    produto: "Milho Híbrido",
    lote: "MIL001",
    quantidade: 500,
    unidade: "sacas",
    deposito: "Armazém A",
    data: "2024-08-09",
    origem: "Cooperativa ABC",
    status: "Confirmada",
    valor: "R$ 45.000,00"
  },
  {
    id: "ENT002",
    produto: "Fertilizante NPK",
    lote: "NPK123",
    quantidade: 2000,
    unidade: "kg",
    deposito: "Armazém B",
    data: "2024-08-08",
    origem: "Fornecedor XYZ",
    status: "Pendente",
    valor: "R$ 8.500,00"
  },
  {
    id: "ENT003",
    produto: "Soja Premium",
    lote: "SOJ045",
    quantidade: 300,
    unidade: "sacas",
    deposito: "Armazém A",
    data: "2024-08-07",
    origem: "Produtor Parceiro",
    status: "Confirmada",
    valor: "R$ 52.800,00"
  }
]

export default function Entradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-muted-foreground">
            Gerencie e registre as entradas de produtos no estoque
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar XML
          </Button>
          <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Entrada</DialogTitle>
                <DialogDescription>
                  Preencha os dados da entrada de produtos no estoque
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
                        <SelectItem value="milho">Milho Híbrido</SelectItem>
                        <SelectItem value="soja">Soja Premium</SelectItem>
                        <SelectItem value="fertilizante">Fertilizante NPK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lote">Número do Lote</Label>
                    <Input id="lote" placeholder="Ex: MIL001" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input id="quantidade" type="number" placeholder="500" />
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
                    <Label htmlFor="deposito">Depósito</Label>
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
                    <Label htmlFor="data">Data da Entrada</Label>
                    <Input id="data" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origem">Origem</Label>
                    <Input id="origem" placeholder="Ex: Cooperativa ABC" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    placeholder="Observações adicionais sobre a entrada..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsNewEntryOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsNewEntryOpen(false)}>
                  Registrar Entrada
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, lote ou origem..."
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

      {/* Entradas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Entradas</CardTitle>
          <CardDescription>
            {entradas.length} entradas registradas
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
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.map((entrada) => (
                <TableRow key={entrada.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{entrada.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      {entrada.produto}
                    </div>
                  </TableCell>
                  <TableCell>{entrada.lote}</TableCell>
                  <TableCell>{entrada.quantidade} {entrada.unidade}</TableCell>
                  <TableCell>{entrada.deposito}</TableCell>
                  <TableCell>{new Date(entrada.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{entrada.origem}</TableCell>
                  <TableCell>
                    <Badge variant={entrada.status === 'Confirmada' ? 'default' : 'secondary'}>
                      {entrada.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{entrada.valor}</TableCell>
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