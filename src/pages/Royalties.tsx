import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRoyalties, useRoyaltyStats } from "@/hooks/useRoyalties"
import { useFecharRoyalty } from "@/hooks/useFecharRoyalty"
import { useGerarRoyalty } from "@/hooks/useGerarRoyalty"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileText, RefreshCw, Check, DollarSign, TrendingUp, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Royalties() {
  const navigate = useNavigate()
  const { data: stats } = useRoyaltyStats()
  const { data: royaltiesPendentes } = useRoyalties({ status: 'pendente' })
  const { data: royaltiesPagos } = useRoyalties({ status: 'pago' })
  const { data: royaltiesRascunho } = useRoyalties({ status: 'rascunho' })
  const fecharRoyalty = useFecharRoyalty()
  const gerarRoyalty = useGerarRoyalty()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "secondary",
      pendente: "default",
      pago: "outline",
      vencido: "destructive",
      cancelado: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  return (
    <TablePageLayout
      title="Royalties"
      description="Gestão de royalties de todas as franquias"
      tableContent={
        <div className="p-6 space-y-6">
          {/* Cards de Resumo Global */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total a Receber
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalReceber || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Royalties pendentes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recebido no Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.recebidoMes || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagamentos do mês atual
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Royalties Pendentes
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendentes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  A serem fechados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vencimentos Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.vencimentosHoje || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Cobranças do dia
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para organizar informações */}
          <Tabs defaultValue="abertos" className="w-full">
            <TabsList>
              <TabsTrigger value="abertos">Royalties em Aberto</TabsTrigger>
              <TabsTrigger value="fechados">Royalties Fechados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="abertos" className="space-y-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Franquia</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Valor Base</TableHead>
                      <TableHead>Valor Royalty</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(royaltiesRascunho || []), ...(royaltiesPendentes || [])].map((royalty) => (
                      <TableRow key={royalty.id}>
                        <TableCell className="font-medium">{royalty.numero_royalty}</TableCell>
                        <TableCell>{royalty.franquias?.nome}</TableCell>
                        <TableCell>
                          {format(new Date(royalty.periodo_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(royalty.periodo_fim), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(royalty.valor_base))}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(royalty.valor_royalties))}
                        </TableCell>
                        <TableCell>{format(new Date(royalty.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>{getStatusBadge(royalty.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/royalties/${royalty.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {royalty.status === 'rascunho' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => gerarRoyalty.mutate({ contrato_franquia_id: royalty.contrato_franquia_id || undefined })}
                                  title="Recalcular"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fecharRoyalty.mutate(royalty.id)}
                                  title="Fechar"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!royaltiesRascunho || royaltiesRascunho.length === 0) && 
                     (!royaltiesPendentes || royaltiesPendentes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum royalty em aberto
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            
            <TabsContent value="fechados" className="space-y-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Franquia</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Valor Royalty</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {royaltiesPagos?.map((royalty) => (
                      <TableRow key={royalty.id}>
                        <TableCell className="font-medium">{royalty.numero_royalty}</TableCell>
                        <TableCell>{royalty.franquias?.nome}</TableCell>
                        <TableCell>
                          {format(new Date(royalty.periodo_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(royalty.periodo_fim), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(royalty.valor_royalties))}
                        </TableCell>
                        <TableCell>
                          {royalty.data_pagamento ? format(new Date(royalty.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(royalty.status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/royalties/${royalty.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!royaltiesPagos || royaltiesPagos.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum royalty fechado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  )
}
