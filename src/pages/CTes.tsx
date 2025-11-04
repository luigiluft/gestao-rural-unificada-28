import { useState } from "react"
import { FileText, Search, Filter, Eye, Edit, Trash2, Download, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { useCTes, useDeleteCTe, useGenerateXML } from "@/hooks/useCTes"
import { CTeDetailsDialog } from "@/components/CTe/CTeDetailsDialog"
import { formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function CTes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCTeId, setSelectedCTeId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const { data: ctes = [], isLoading, error } = useCTes()
  const deleteMutation = useDeleteCTe()
  const generateXMLMutation = useGenerateXML()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'secondary'
      case 'autorizado':
        return 'default'
      case 'cancelado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'autorizado':
        return 'Autorizado'
      case 'cancelado':
        return 'Cancelado'
      case 'denegado':
        return 'Denegado'
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleViewCTe = (cteId: string) => {
    setSelectedCTeId(cteId)
    setDetailsDialogOpen(true)
  }

  const handleDeleteCTe = async (cteId: string) => {
    if (confirm("Tem certeza que deseja excluir este CT-e? Esta ação não pode ser desfeita.")) {
      try {
        await deleteMutation.mutateAsync(cteId)
      } catch (error) {
        console.error("Erro ao excluir CT-e:", error)
      }
    }
  }

  const handleDownloadXML = async (cte: any) => {
    if (!cte.xml_content) {
      // Generate XML first
      try {
        const result = await generateXMLMutation.mutateAsync(cte.id)
        downloadXMLFile(result.xml, cte.numero_cte)
      } catch (error) {
        console.error("Erro ao gerar XML:", error)
      }
    } else {
      downloadXMLFile(cte.xml_content, cte.numero_cte)
    }
  }

  const downloadXMLFile = (xmlContent: string, numeroCte: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `CT-e_${numeroCte}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("XML baixado com sucesso!")
  }

  const filteredCTes = ctes.filter(cte => {
    const matchesSearch = 
      cte.numero_cte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cte.emitente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cte.destinatario_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || cte.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState variant="spinner" text="Carregando CT-es..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar CT-es: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            CT-e (Conhecimento de Transporte Eletrônico)
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de documentos de transporte eletrônicos
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, emitente ou destinatário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="denegado">Denegado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* CT-es List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CT-es Cadastrados</CardTitle>
              <CardDescription>
                Total de {filteredCTes.length} CT-e(s) encontrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCTes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Nenhum CT-e encontrado"
              description="CT-es são gerados automaticamente quando você cria uma saída com tipo 'Entrega na Fazenda'."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Emitente</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCTes.map((cte) => (
                    <TableRow key={cte.id}>
                      <TableCell className="font-medium">{cte.numero_cte}</TableCell>
                      <TableCell>{formatDate(cte.data_emissao)}</TableCell>
                      <TableCell>{cte.emitente_nome}</TableCell>
                      <TableCell>{cte.destinatario_nome}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cte.municipio_inicio_nome}/{cte.municipio_inicio_uf}
                          <br />→ {cte.municipio_fim_nome}/{cte.municipio_fim_uf}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(cte.valor_total_servico)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(cte.status)}>
                          {getStatusLabel(cte.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ações
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCTe(cte.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {cte.status === 'rascunho' && (
                              <>
                                <DropdownMenuItem onClick={() => handleDownloadXML(cte)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar XML
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCTe(cte.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                            {cte.status !== 'rascunho' && cte.xml_content && (
                              <DropdownMenuItem onClick={() => handleDownloadXML(cte)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar XML
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CTeDetailsDialog
        cteId={selectedCTeId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  )
}