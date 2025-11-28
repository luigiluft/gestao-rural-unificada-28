import { useState } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSolicitacoesFilial, useUpdateSolicitacaoFilial } from "@/hooks/useSolicitacoesFilial"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { SolicitacaoFilialWithRelations } from "@/hooks/useSolicitacoesFilial"

const STATUS_CONFIG = {
  pendente: { label: "Pendente", icon: Clock, variant: "secondary" as const },
  em_andamento: { label: "Em Andamento", icon: Clock, variant: "default" as const },
  concluida: { label: "Concluída", icon: CheckCircle, variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200" },
  rejeitada: { label: "Rejeitada", icon: XCircle, variant: "destructive" as const },
}

export default function SolicitacoesFilial() {
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoFilialWithRelations | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [observacoes, setObservacoes] = useState("")
  
  const { data: solicitacoes = [], isLoading } = useSolicitacoesFilial()
  const updateSolicitacao = useUpdateSolicitacaoFilial()

  const handleUpdateStatus = async () => {
    if (!selectedSolicitacao || !newStatus) return

    try {
      await updateSolicitacao.mutateAsync({
        id: selectedSolicitacao.id,
        status: newStatus as any,
        observacoes: observacoes || undefined,
        data_conclusao: newStatus === 'concluida' ? new Date().toISOString() : undefined
      })
      setDetailsOpen(false)
      setSelectedSolicitacao(null)
      setNewStatus("")
      setObservacoes("")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const openDetails = (solicitacao: SolicitacaoFilialWithRelations) => {
    setSelectedSolicitacao(solicitacao)
    setNewStatus(solicitacao.status)
    setObservacoes(solicitacao.observacoes || "")
    setDetailsOpen(true)
  }

  const renderSolicitacaoCard = (solicitacao: SolicitacaoFilialWithRelations) => {
    const statusConfig = STATUS_CONFIG[solicitacao.status]
    const StatusIcon = statusConfig.icon

    return (
      <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {solicitacao.empresa_matriz?.razao_social || "Empresa"}
              </CardTitle>
              <CardDescription>
                CNPJ: {solicitacao.empresa_matriz?.cpf_cnpj || "N/A"}
              </CardDescription>
            </div>
            <Badge variant={statusConfig.variant} className={'className' in statusConfig ? statusConfig.className : ''}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Depósito:</span>
            <p className="font-medium">{solicitacao.deposito?.nome || "N/A"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Data da Solicitação:</span>
            <p className="text-sm">{new Date(solicitacao.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          {solicitacao.data_conclusao && (
            <div>
              <span className="text-sm text-muted-foreground">Data de Conclusão:</span>
              <p className="text-sm">{new Date(solicitacao.data_conclusao).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {Object.keys(solicitacao.documentos).length} documentos anexados
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => openDetails(solicitacao)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando solicitações...</p>
        </div>
      </AppLayout>
    )
  }

  const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente')
  const solicitacoesAndamento = solicitacoes.filter(s => s.status === 'em_andamento')
  const solicitacoesConcluidas = solicitacoes.filter(s => s.status === 'concluida')
  const solicitacoesRejeitadas = solicitacoes.filter(s => s.status === 'rejeitada')

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Filial</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de abertura de filiais</p>
        </div>

        <Tabs defaultValue="pendentes">
          <TabsList>
            <TabsTrigger value="pendentes">
              Pendentes ({solicitacoesPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="em_andamento">
              Em Andamento ({solicitacoesAndamento.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({solicitacoesConcluidas.length})
            </TabsTrigger>
            <TabsTrigger value="rejeitadas">
              Rejeitadas ({solicitacoesRejeitadas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solicitacoesPendentes.map(renderSolicitacaoCard)}
            </div>
            {solicitacoesPendentes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma solicitação pendente
              </div>
            )}
          </TabsContent>

          <TabsContent value="em_andamento" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solicitacoesAndamento.map(renderSolicitacaoCard)}
            </div>
            {solicitacoesAndamento.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma solicitação em andamento
              </div>
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solicitacoesConcluidas.map(renderSolicitacaoCard)}
            </div>
            {solicitacoesConcluidas.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma solicitação concluída
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejeitadas" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solicitacoesRejeitadas.map(renderSolicitacaoCard)}
            </div>
            {solicitacoesRejeitadas.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma solicitação rejeitada
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Visualize e gerencie a solicitação de abertura de filial
            </DialogDescription>
          </DialogHeader>

          {selectedSolicitacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Empresa Matriz</Label>
                  <p className="text-sm font-medium">{selectedSolicitacao.empresa_matriz?.razao_social}</p>
                  <p className="text-xs text-muted-foreground">{selectedSolicitacao.empresa_matriz?.cpf_cnpj}</p>
                </div>
                <div>
                  <Label>Depósito</Label>
                  <p className="text-sm font-medium">{selectedSolicitacao.deposito?.nome}</p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre esta solicitação..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Documentos Anexados</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedSolicitacao.documentos).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {key.replace(/_/g, ' ')}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateStatus}>
                  Atualizar Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
