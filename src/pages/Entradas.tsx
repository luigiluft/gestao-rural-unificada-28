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
  MoreHorizontal,
  FileText,
  Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/Entradas/FileUpload"
import { FormularioEntrada } from "@/components/Entradas/FormularioEntrada"
import { NFData } from "@/components/Entradas/NFParser"
import { useToast } from "@/hooks/use-toast"

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
  const [nfData, setNfData] = useState<NFData | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const { toast } = useToast()

  const handleNFDataParsed = (data: NFData) => {
    setNfData(data)
    setActiveTab("formulario")
    toast({
      title: "NFe processada com sucesso",
      description: `Nota fiscal ${data.numeroNF}/${data.serie} importada com ${data.itens.length} itens.`,
    })
  }

  const handleUploadError = (message: string) => {
    toast({
      title: "Erro no upload",
      description: message,
      variant: "destructive",
    })
  }

  const handleFormSubmit = (dados: any) => {
    console.log('Dados da entrada:', dados)
    toast({
      title: "Entrada registrada",
      description: "A entrada foi registrada com sucesso no sistema.",
    })
    setIsNewEntryOpen(false)
    setNfData(null)
    setActiveTab("upload")
  }

  const handleFormCancel = () => {
    setIsNewEntryOpen(false)
    setNfData(null)
    setActiveTab("upload")
  }

  const handleNovaEntradaManual = () => {
    setNfData(null)
    setActiveTab("formulario")
  }

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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setIsNewEntryOpen(true)
              setActiveTab("upload")
            }}
          >
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
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Entrada</DialogTitle>
                <DialogDescription>
                  Importe uma NFe ou preencha os dados manualmente
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload NFe
                  </TabsTrigger>
                  <TabsTrigger value="formulario" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Formulário
                  </TabsTrigger>
                  <TabsTrigger value="manual" onClick={handleNovaEntradaManual} className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Manual
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-6">
                  <FileUpload 
                    onNFDataParsed={handleNFDataParsed}
                    onError={handleUploadError}
                  />
                  
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={handleNovaEntradaManual}>
                      Ou preencher manualmente
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="formulario" className="mt-6">
                  <FormularioEntrada
                    nfData={nfData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </TabsContent>

                <TabsContent value="manual" className="mt-6">
                  <FormularioEntrada
                    nfData={null}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </TabsContent>
              </Tabs>
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