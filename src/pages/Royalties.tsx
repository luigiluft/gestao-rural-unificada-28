import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, DollarSign, TrendingUp, Calendar } from "lucide-react"

export default function Royalties() {
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
                <div className="text-2xl font-bold">R$ 0,00</div>
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
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Pagamentos do mês atual
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Franquias Ativas
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Total de franquias
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Cobranças do dia
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para organizar informações */}
          <Tabs defaultValue="pendentes" className="w-full">
            <TabsList>
              <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
              <TabsTrigger value="franquias">Por Franquia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Royalties Pendentes</CardTitle>
                  <CardDescription>
                    Cobranças a receber das franquias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhum royalty pendente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pagos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Royalties Recebidos</CardTitle>
                  <CardDescription>
                    Histórico de pagamentos realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhum pagamento registrado
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="franquias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Royalties por Franquia</CardTitle>
                  <CardDescription>
                    Visão detalhada por unidade franqueada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Nenhuma franquia cadastrada
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
