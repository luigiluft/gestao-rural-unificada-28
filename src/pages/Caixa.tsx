import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { useFaturas, useFaturaStats } from "@/hooks/useFaturas"
import { useRoyalties } from "@/hooks/useRoyalties"
import { useTotalFolhaPagamento } from "@/hooks/useFolhaPagamento"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"

export default function Caixa() {
  const { user } = useAuth()
  const { userRole } = useUserRole()
  
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

  // Buscar faturas
  const { data: faturas = [] } = useFaturas({ 
    franquia_id: franquia?.id,
    incluir_rascunho: userRole === 'cliente' || userRole === 'admin'
  })
  const { data: stats } = useFaturaStats()
  
  // Buscar royalties
  const { data: royaltiesData = [] } = useRoyalties({
    franquia_id: franquia?.id
  })
  
  // Buscar total da folha de pagamento
  const { data: totalFolhaPagamento = 0 } = useTotalFolhaPagamento()
  
  // Filtrar royalties em aberto
  const royaltiesEmAberto = royaltiesData.filter(r => r.status === 'rascunho' || r.status === 'pendente')
  
  // Calcular valores de receitas
  const receitaTotal = stats?.receitaTotal || 0
  const totalAReceber = faturas
    .filter(f => f.status === 'pendente' || f.status === 'rascunho')
    .reduce((sum, f) => sum + Number(f.valor_total || 0), 0)
  
  // Calcular valores de despesas
  const totalRoyalties = royaltiesEmAberto.reduce((sum, r) => sum + Number(r.valor_total || 0), 0)
  const totalRoyaltiesPagos = royaltiesData
    .filter(r => r.status === 'pago')
    .reduce((sum, r) => sum + Number(r.valor_total || 0), 0)
  
  // Calcular despesas totais (royalties + folha)
  const totalDespesas = totalRoyalties + totalFolhaPagamento
  const totalDespesasPagas = totalRoyaltiesPagos // Por enquanto só royalties são "pagos"
  
  // Cálculos de fluxo de caixa
  const saldoLiquido = totalAReceber - totalDespesas
  const fluxoCaixaRealizado = receitaTotal - totalDespesasPagas

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <TablePageLayout
      title="Fluxo de Caixa"
      description="Visão consolidada do fluxo de caixa"
      tableContent={
        <div className="p-6 space-y-6">
          {/* Cards de Resumo - Fluxo de Caixa Previsto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Previsto</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total a Receber
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAReceber)}</div>
                  <p className="text-xs text-muted-foreground">
                    Receitas pendentes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total a Pagar
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</div>
                  <p className="text-xs text-muted-foreground">
                    Royalties + Folha de pagamento
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Previsto
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(saldoLiquido)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A Receber - A Pagar
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cards de Resumo - Fluxo de Caixa Realizado */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Realizado</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Recebido
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(receitaTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    Receitas recebidas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Pago
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesasPagas)}</div>
                  <p className="text-xs text-muted-foreground">
                    Despesas efetivadas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Realizado
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${fluxoCaixaRealizado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(fluxoCaixaRealizado)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recebido - Pago
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Análise Consolidada */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Consolidada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado Operacional (Previsto)</p>
                  <p className="text-xs text-muted-foreground mt-1">Diferença entre receitas e despesas previstas</p>
                </div>
                <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoLiquido)}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado Operacional (Realizado)</p>
                  <p className="text-xs text-muted-foreground mt-1">Diferença entre receitas e despesas efetivadas</p>
                </div>
                <div className={`text-2xl font-bold ${fluxoCaixaRealizado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(fluxoCaixaRealizado)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  )
}
