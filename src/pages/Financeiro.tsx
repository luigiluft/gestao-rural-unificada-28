import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Receipt, TrendingUp } from "lucide-react"

export default function Financeiro() {
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
                <div className="text-2xl font-bold">R$ 0,00</div>
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
                <div className="text-2xl font-bold">R$ 0,00</div>
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
                <div className="text-2xl font-bold">R$ 0,00</div>
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
                  <CardTitle>Faturas Pagas pelos Clientes</CardTitle>
                  <CardDescription>
                    Histórico de pagamentos recebidos dos produtores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhuma fatura encontrada
                  </div>
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
                    Nenhuma conta a pagar
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
