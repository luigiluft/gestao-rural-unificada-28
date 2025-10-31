import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Receipt, TrendingUp, Lock } from "lucide-react"
import { useFaturas, useFaturaStats } from "@/hooks/useFaturas"
import { useFaturaMutations } from "@/hooks/useFaturaMutations"
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
    incluir_rascunho: userRole === 'franqueado' || userRole === 'admin'
  })
  const { data: stats } = useFaturaStats()
  
  // Calcular valores
  const receitaTotal = stats?.receitaTotal || 0
  const receitaPendente = stats?.receitaPendente || 0
  
  // TODO: Calcular royalties (5% da receita, por exemplo)
  const royalties = receitaTotal * 0.05
  const saldoLiquido = receitaTotal - royalties

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
          <div className="grid gap-4 md:grid-cols-3">
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
                  Royalties a Pagar
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(royalties)}</div>
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
                  Receita - Royalties
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
                          {(userRole === 'franqueado' || userRole === 'admin') && (
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
                            {(userRole === 'franqueado' || userRole === 'admin') && (
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
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Funcionalidade em desenvolvimento
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  )
}
