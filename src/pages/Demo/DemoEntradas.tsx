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
  Download,
  User,
  AlertTriangle,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/Entradas/FileUpload"
import { FormularioEntrada } from "@/components/Entradas/FormularioEntrada"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { mockData } from "@/data/mockData"
import { useTutorial } from "@/contexts/TutorialContext"

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const },
    'em_transferencia': { label: 'Em Transferência', variant: 'default' as const },
    'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const },
    'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const },
    'confirmado': { label: 'Confirmado', variant: 'default' as const },
    'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const },
    'processando': { label: 'Processando', variant: 'secondary' as const }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || 
    { label: status || 'Desconhecido', variant: 'secondary' as const }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function DemoEntradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const { toast } = useToast()
  const navigate = useNavigate()
  const { isActive, nextStep } = useTutorial()
  
  const entradas = mockData.entradas

  const handleNFDataParsed = (data: any) => {
    setActiveTab("manual")
    toast({
      title: "NFe processada com sucesso",
      description: `Nota fiscal ${data.numeroNF}/${data.serie} importada com ${data.itens?.length || 0} itens.`,
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
    toast({
      title: "Entrada registrada",
      description: "A entrada foi registrada com sucesso no sistema de demonstração.",
    })
    
    setIsNewEntryOpen(false)
    setActiveTab("upload")
    
    // Se estamos no tutorial, avançar para próximo passo
    if (isActive) {
      setTimeout(() => {
        nextStep()
      }, 1000)
    }
  }

  const handleFormCancel = () => {
    setIsNewEntryOpen(false)
    setActiveTab("upload")
  }

  const handleNovaEntradaManual = () => {
    setActiveTab("manual")
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Indicator */}
      {isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-amber-700 font-medium">MODO DEMONSTRAÇÃO</span>
            <span className="text-amber-600 text-sm">- Dados fictícios para tutorial</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entradas</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe as entradas de produtos no estoque
            </p>
          </div>
          
          <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90" id="nova-entrada-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" id="entrada-modal">
              <DialogHeader>
                <DialogTitle>Registrar Nova Entrada</DialogTitle>
                <DialogDescription>
                  Importe uma NFe ou preencha os dados manualmente
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload NFe</TabsTrigger>
                  <TabsTrigger value="manual">Preenchimento Manual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <FileUpload
                    onNFDataParsed={handleNFDataParsed}
                    onError={handleUploadError}
                  />
                  
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleNovaEntradaManual}
                      className="text-sm"
                    >
                      Ou preencher manualmente
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <FormularioEntrada
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    nfData={null}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Entradas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Entradas Registradas</CardTitle>
          <CardDescription>
            {entradas.length} entradas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>NFe</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map((entrada) => (
                  <TableRow key={entrada.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">{entrada.numero_nfe}/{entrada.serie}</p>
                        <p className="text-xs text-muted-foreground">
                          {entrada.id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{entrada.fornecedores?.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            CNPJ: {entrada.emitente_cnpj}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {new Date(entrada.data_entrada).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Emissão: {new Date(entrada.data_emissao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {entrada.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entrada.status_aprovacao} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {entrada.entrada_itens?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                              <Package className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm">
                              {item.nome_produto} ({item.quantidade} {item.unidade_comercial})
                            </span>
                          </div>
                        ))}
                        {(entrada.entrada_itens?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{(entrada.entrada_itens?.length || 0) - 2} mais
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver NFe
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar XML
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}