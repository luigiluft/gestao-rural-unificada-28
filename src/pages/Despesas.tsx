import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Receipt, AlertCircle, Users } from "lucide-react"
import { useRoyalties } from "@/hooks/useRoyalties"
import { useTotalFolhaPagamento } from "@/hooks/useFolhaPagamento"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function Despesas() {
  const { user } = useAuth()
  
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
  
  // Buscar royalties em aberto (rascunho e pendente)
  const { data: royaltiesData = [], isLoading } = useRoyalties({
    franquia_id: franquia?.id
  })
  
  // Buscar total da folha de pagamento
  const { data: totalFolhaPagamento = 0 } = useTotalFolhaPagamento()
  
  // Filtrar royalties em aberto
  const royaltiesEmAberto = royaltiesData.filter(r => r.status === 'rascunho' || r.status === 'pendente')
  
  // Calcular total de royalties em aberto
  const totalRoyalties = royaltiesEmAberto.reduce((sum, r) => sum + Number(r.valor_total || 0), 0)
  
  // Calcular total de royalties pagos
  const totalRoyaltiesPagos = royaltiesData
    .filter(r => r.status === 'pago')
    .reduce((sum, r) => sum + Number(r.valor_total || 0), 0)
  
  // Calcular total de despesas
  const totalDespesas = totalRoyalties + totalFolhaPagamento

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
      title="Despesas"
      description="Gestão de despesas e royalties"
      tableContent={
        <div className="p-6 space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Despesas
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalDespesas)}</div>
                <p className="text-xs text-muted-foreground">
                  Royalties + Folha de Pagamento
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
                  Folha de Pagamento
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalFolhaPagamento)}</div>
                <p className="text-xs text-muted-foreground">
                  Salários mensais
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para separar Royalties e Folha */}
          <Tabs defaultValue="royalties" className="w-full">
            <TabsList>
              <TabsTrigger value="royalties">Royalties</TabsTrigger>
              <TabsTrigger value="folha">Folha de Pagamento</TabsTrigger>
            </TabsList>
            
            <TabsContent value="royalties" className="space-y-4">
              <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar - Royalties Luft</CardTitle>
              <CardDescription>
                Valores devidos à Luft pelos serviços prestados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Carregando...
                </div>
              ) : royaltiesData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum royalty encontrado
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
                    {royaltiesData.map((royalty) => (
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
            
            <TabsContent value="folha" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Folha de Pagamento</CardTitle>
                  <CardDescription>
                    Total de salários mensais a pagar. Gerencie os funcionários na página de Funcionários no menu Cadastro.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-6 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Total Mensal</p>
                        <p className="text-xs text-muted-foreground">Folha de pagamento consolidada</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(totalFolhaPagamento)}</div>
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
