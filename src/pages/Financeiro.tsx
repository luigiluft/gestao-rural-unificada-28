import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Receipt, TrendingUp, Lock, Clock } from "lucide-react"
import { useFaturas, useFaturaStats } from "@/hooks/useFaturas"
import { useFaturaMutations } from "@/hooks/useFaturaMutations"
import { useRoyalties } from "@/hooks/useRoyalties"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useUserRole } from "@/hooks/useUserRole"

export default function Financeiro() {
  const { user } = useAuth()
  const { userRole } = useUserRole()
  const { fecharFatura } = useFaturaMutations()
  
  // Buscar franquia do usuário logado
  const { data: franquia } = useQuery({
    queryKey: ['franquia-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Franqueados veem todas as faturas (incluindo rascunhos)
  // Produtores veem apenas faturas fechadas
  const { data: faturas = [], isLoading } = useFaturas({ 
    franquia_id: franquia?.id,
    incluir_rascunho: userRole === 'operador' || userRole === 'admin'
  })
  const { data: stats } = useFaturaStats()
  
  // Buscar royalties em aberto (rascunho e pendente)
  const { data: royaltiesData = [], isLoading: isLoadingRoyalties } = useRoyalties({
    franquia_id: franquia?.id
  })
  
  // Filtrar royalties em aberto
  const royaltiesEmAberto = royaltiesData.filter(r => r.status === 'rascunho' || r.status === 'pendente')
  
  // Calcular valores
  const receitaTotal = stats?.receitaTotal || 0
  const receitaPendente = stats?.receitaPendente || 0
  
  // Calcular total a receber (pendentes + rascunhos)
  const totalAReceber = faturas
    .filter(f => f.status === 'pendente' || f.status === 'rascunho')
    .reduce((sum, f) => sum + Number(f.valor_total || 0), 0)
  
  // Calcular total de royalties em aberto
  const totalRoyalties = royaltiesEmAberto.reduce((sum, r) => sum + Number(r.valor_total || 0), 0)
  
  // Saldo líquido = A Receber - Royalties a Pagar
  const saldoLiquido = totalAReceber - totalRoyalties

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "outline",
      pendente: "secondary",
      pago: "default",
      vencido: "destructive",
      cancelado: "outline"
    }
    
    const labels: Record<string, string> = {
      rascunho: "Em Andamento",
      pendente: "Pendente",
      pago: "Pago",
      vencido: "Vencido",
      cancelado: "Cancelado"
    }
    
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>
  }

  return (
    <TablePageLayout
      title="Financeiro"
      description="Gestão financeira da franquia"
      tableContent={
        <div className="p-6 space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(receitaTotal)}</div>
                <p className="text-xs text-muted-foreground">
                  Faturas pagas pelos clientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  A Receber
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAReceber)}</div>
                <p className="text-xs text-muted-foreground">
                  Faturas pendentes de pagamento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Royalties a Pagar
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRoyalties)}</div>
                <p className="text-xs text-muted-foreground">
                  Contas a pagar para a Luft
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Líquido
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(saldoLiquido)}</div>
                <p className="text-xs text-muted-foreground">
                  A Receber - Royalties
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para separar Faturas e Contas a Pagar */}
          <Tabs defaultValue="faturas" className="w-full">
            <TabsList>
              <TabsTrigger value="faturas">Faturas Recebidas</TabsTrigger>
              <TabsTrigger value="royalties">Royalties a Pagar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faturas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Faturas dos Clientes</CardTitle>
                  <CardDescription>
                    Histórico de faturamento dos produtores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Carregando...
                    </div>
                  ) : faturas.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Nenhuma fatura encontrada
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Emissão</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Status</TableHead>
                          {(userRole === 'operador' || userRole === 'admin') && (
                            <TableHead>Ações</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faturas.map((fatura) => (
                          <TableRow key={fatura.id}>
                            <TableCell className="font-medium">{fatura.numero_fatura}</TableCell>
                            <TableCell>{fatura.produtores_profiles?.nome}</TableCell>
                            <TableCell>
                              {format(new Date(fatura.periodo_inicio), 'dd/MM/yy', { locale: ptBR })} - {' '}
                              {format(new Date(fatura.periodo_fim), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{format(new Date(fatura.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell>{format(new Date(fatura.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(fatura.valor_total)}</TableCell>
                            <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                            {(userRole === 'operador' || userRole === 'admin') && (
                              <TableCell>
                                {fatura.status === 'rascunho' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fecharFatura.mutate(fatura.id)}
                                    disabled={fecharFatura.isPending}
                                  >
                                    <Lock className="h-4 w-4 mr-1" />
                                    Fechar
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="royalties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contas a Pagar - Royalties Luft</CardTitle>
                  <CardDescription>
                    Valores devidos à Luft pelos serviços prestados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRoyalties ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Carregando...
                    </div>
                  ) : royaltiesEmAberto.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Nenhum royalty em aberto
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Emissão</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor Base</TableHead>
                          <TableHead className="text-right">Royalties</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {royaltiesEmAberto.map((royalty) => (
                          <TableRow key={royalty.id}>
                            <TableCell className="font-medium">{royalty.numero_royalty}</TableCell>
                            <TableCell>
                              {format(new Date(royalty.periodo_inicio), 'dd/MM/yy', { locale: ptBR })} - {' '}
                              {format(new Date(royalty.periodo_fim), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{format(new Date(royalty.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell>{format(new Date(royalty.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(royalty.valor_base || 0))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(royalty.valor_royalties || 0))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(royalty.valor_total || 0))}</TableCell>
                            <TableCell>{getStatusBadge(royalty.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  )
}
