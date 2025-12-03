import { useState } from "react"
import { useCotacoesLoja, CotacaoComItens } from "@/hooks/useCotacoesLoja"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Building,
  Mail,
  Phone,
  Search
} from "lucide-react"

const statusConfig = {
  pendente: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  em_analise: { label: "Em Análise", variant: "outline" as const, icon: FileText },
  aprovada: { label: "Aprovada", variant: "default" as const, icon: CheckCircle },
  rejeitada: { label: "Rejeitada", variant: "destructive" as const, icon: XCircle },
  convertida: { label: "Convertida", variant: "default" as const, icon: CheckCircle },
}

const CotacoesRecebidas = () => {
  const { cotacoes, isLoading, updateStatus, isUpdating } = useCotacoesLoja()
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoComItens | null>(null)
  const [resposta, setResposta] = useState("")
  const [filtro, setFiltro] = useState("")

  const cotacoesFiltradas = cotacoes.filter(c => 
    c.consumidor_nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.consumidor_email.toLowerCase().includes(filtro.toLowerCase()) ||
    c.consumidor_empresa?.toLowerCase().includes(filtro.toLowerCase())
  )

  const getMeses = () => {
    const hoje = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const mes = addMonths(hoje, i)
      return format(mes, "MMM/yy", { locale: ptBR })
    })
  }

  const meses = getMeses()

  const handleAprovar = () => {
    if (!selectedCotacao) return
    updateStatus({ id: selectedCotacao.id, status: "aprovada", resposta })
    setSelectedCotacao(null)
    setResposta("")
  }

  const handleRejeitar = () => {
    if (!selectedCotacao) return
    updateStatus({ id: selectedCotacao.id, status: "rejeitada", resposta })
    setSelectedCotacao(null)
    setResposta("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou empresa..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cotações List */}
      {cotacoesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma cotação recebida</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cotacoesFiltradas.map((cotacao) => {
            const config = statusConfig[cotacao.status]
            const StatusIcon = config.icon
            
            return (
              <Card key={cotacao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">{cotacao.consumidor_nome}</h3>
                        <Badge variant={config.variant} className="shrink-0">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {cotacao.consumidor_email}
                        </span>
                        {cotacao.consumidor_telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {cotacao.consumidor_telefone}
                          </span>
                        )}
                        {cotacao.consumidor_empresa && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            {cotacao.consumidor_empresa}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Recebida em {format(new Date(cotacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {" · "}{cotacao.itens?.length || 0} produto(s)
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCotacao(cotacao)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedCotacao} onOpenChange={() => setSelectedCotacao(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Cotação</DialogTitle>
          </DialogHeader>

          {selectedCotacao && (
            <div className="space-y-6">
              {/* Consumer Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Dados do Solicitante</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedCotacao.consumidor_nome}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">E-mail</p>
                      <p className="font-medium">{selectedCotacao.consumidor_email}</p>
                    </div>
                    {selectedCotacao.consumidor_telefone && (
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{selectedCotacao.consumidor_telefone}</p>
                      </div>
                    )}
                    {selectedCotacao.consumidor_empresa && (
                      <div>
                        <p className="text-muted-foreground">Empresa</p>
                        <p className="font-medium">{selectedCotacao.consumidor_empresa}</p>
                      </div>
                    )}
                  </div>
                  {selectedCotacao.observacoes && (
                    <div className="pt-2 border-t mt-2">
                      <p className="text-muted-foreground">Observações</p>
                      <p>{selectedCotacao.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products Table */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Produtos Solicitados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-card">Produto</TableHead>
                          {meses.map((mes, i) => (
                            <TableHead key={i} className="text-center min-w-[70px]">
                              {mes}
                            </TableHead>
                          ))}
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCotacao.itens?.map((item) => {
                          const quantidades = [
                            item.mes_1, item.mes_2, item.mes_3, item.mes_4,
                            item.mes_5, item.mes_6, item.mes_7, item.mes_8,
                            item.mes_9, item.mes_10, item.mes_11, item.mes_12
                          ]
                          const total = quantidades.reduce((a, b) => a + b, 0)

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="sticky left-0 bg-card font-medium">
                                {item.produto?.nome_produto || "Produto"}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({item.produto?.unidade_medida})
                                </span>
                              </TableCell>
                              {quantidades.map((qtd, i) => (
                                <TableCell key={i} className="text-center">
                                  {qtd > 0 ? qtd : "-"}
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-medium">
                                {total}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Response */}
              {selectedCotacao.status === "pendente" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resposta (opcional)</label>
                  <Textarea
                    placeholder="Adicione uma mensagem para o solicitante..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {selectedCotacao.resposta_cliente && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Resposta enviada:</p>
                  <p className="text-sm">{selectedCotacao.resposta_cliente}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedCotacao?.status === "pendente" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejeitar}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  onClick={handleAprovar}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              </>
            )}
            {selectedCotacao?.status !== "pendente" && (
              <Button variant="outline" onClick={() => setSelectedCotacao(null)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CotacoesRecebidas
