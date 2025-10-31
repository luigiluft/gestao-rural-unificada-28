import { useParams, useNavigate } from "react-router-dom"
import { useContratoDetalhes } from "@/hooks/useContratoDetalhes"
import { useContratoMutations } from "@/hooks/useContratoMutations"
import { useFaturaMutations } from "@/hooks/useFaturaMutations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Calendar, DollarSign, AlertCircle, Receipt, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FormularioContrato } from "@/components/Contratos/FormularioContrato"
import { useState } from "react"

export default function ContratoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useContratoDetalhes(id)
  const { cancelContrato } = useContratoMutations()
  const { gerarFatura } = useFaturaMutations()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  }

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!data?.contrato) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Button onClick={() => navigate('/contratos')} className="mt-4">
          Voltar para Contratos
        </Button>
      </div>
    )
  }

  const { contrato, servicos, slas, janelas, faturas } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contratos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contrato {contrato.numero_contrato}</h1>
            <p className="text-muted-foreground">
              {contrato.franquias?.nome} → {contrato.produtor?.nome}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Contrato</DialogTitle>
              </DialogHeader>
              <FormularioContrato 
                contratoId={id}
                onSuccess={() => {
                  setEditDialogOpen(false)
                  refetch()
                }}
              />
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline"
            onClick={() => gerarFatura.mutate(contrato.id)}
            disabled={gerarFatura.isPending}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Gerar Fatura
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm('Tem certeza que deseja cancelar este contrato?')) {
                cancelContrato.mutate(contrato.id)
              }
            }}
            disabled={contrato.status !== 'ativo'}
          >
            Cancelar Contrato
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div>{formatDate(contrato.data_inicio)}</div>
                <div>{contrato.data_fim ? formatDate(contrato.data_fim) : 'Indeterminado'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>{contrato.tipo_cobranca}</div>
              <div className="text-muted-foreground">Venc: dia {contrato.dia_vencimento}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              contrato.status === 'ativo' ? 'default' :
              contrato.status === 'suspenso' ? 'outline' :
              'destructive'
            }>
              {contrato.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Ver detalhes nos serviços contratados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="servicos" className="w-full">
        <TabsList>
          <TabsTrigger value="servicos">Serviços ({servicos.length})</TabsTrigger>
          <TabsTrigger value="slas">SLAs ({slas.length})</TabsTrigger>
          <TabsTrigger value="janelas">Janelas de Entrega ({janelas.length})</TabsTrigger>
          <TabsTrigger value="faturas">Faturas ({faturas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Contratados</CardTitle>
              <CardDescription>Lista de serviços incluídos neste contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd. Incluída</TableHead>
                    <TableHead>Qtd. Mínima</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Valor Excedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicos.map((servico) => (
                    <TableRow key={servico.id}>
                      <TableCell className="font-medium">{servico.tipo_servico}</TableCell>
                      <TableCell>{servico.descricao || '-'}</TableCell>
                      <TableCell>{servico.quantidade_incluida || '-'}</TableCell>
                      <TableCell>{servico.quantidade_minima || '-'}</TableCell>
                      <TableCell>{formatCurrency(servico.valor_unitario)}</TableCell>
                      <TableCell>{servico.valor_excedente ? formatCurrency(servico.valor_excedente) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slas">
          <Card>
            <CardHeader>
              <CardTitle>SLAs (Service Level Agreements)</CardTitle>
              <CardDescription>Acordos de nível de serviço estabelecidos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Penalidade %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slas.map((sla) => (
                    <TableRow key={sla.id}>
                      <TableCell className="font-medium">{sla.tipo_sla}</TableCell>
                      <TableCell>{sla.descricao || '-'}</TableCell>
                      <TableCell>{sla.valor_esperado} {sla.unidade}</TableCell>
                      <TableCell>{sla.penalidade_percentual ? `${sla.penalidade_percentual}%` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="janelas">
          <Card>
            <CardHeader>
              <CardTitle>Janelas de Entrega</CardTitle>
              <CardDescription>Horários disponíveis para recebimento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia da Semana</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Capacidade Máxima</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {janelas.map((janela) => (
                    <TableRow key={janela.id}>
                      <TableCell className="font-medium">{diasSemana[janela.dia_semana]}</TableCell>
                      <TableCell>{janela.hora_inicio} - {janela.hora_fim}</TableCell>
                      <TableCell>{janela.capacidade_max_pallets || '-'}</TableCell>
                      <TableCell>{janela.observacoes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturas">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Geradas</CardTitle>
              <CardDescription>Histórico de faturamento deste contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((fatura) => (
                    <TableRow 
                      key={fatura.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/faturas/${fatura.id}`)}
                    >
                      <TableCell className="font-medium">{fatura.numero_fatura}</TableCell>
                      <TableCell>{formatDate(fatura.data_emissao)}</TableCell>
                      <TableCell>{formatDate(fatura.data_vencimento)}</TableCell>
                      <TableCell>{formatCurrency(fatura.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          fatura.status === 'pago' ? 'default' :
                          fatura.status === 'pendente' ? 'outline' :
                          'destructive'
                        }>
                          {fatura.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
