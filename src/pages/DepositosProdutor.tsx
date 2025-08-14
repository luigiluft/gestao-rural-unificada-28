import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GerenciarDepositosProdutor } from "@/components/Franqueados/GerenciarDepositosProdutor"
import { useAuth } from "@/contexts/AuthContext"
import { useDepositosDisponiveis } from "@/hooks/useDepositosDisponiveis"
import { useEstoque } from "@/hooks/useEstoque"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Separator } from "@/components/ui/separator"

export default function DepositosProdutor() {
  const { user } = useAuth()
  const { data: depositosDisponiveis } = useDepositosDisponiveis(user?.id)
  const { data: estoque } = useEstoque()

  // Agrupar estoque por depósito
  const estoquePorDeposito = estoque?.reduce((acc, item) => {
    const depositoId = item.depositos?.nome || 'Sem depósito'
    if (!acc[depositoId]) {
      acc[depositoId] = []
    }
    acc[depositoId].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meus Depósitos</h1>
          <p className="text-muted-foreground">
            Gerencie onde seus produtos estão armazenados
          </p>
        </div>

        {/* Depósitos Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Depósitos Autorizados</CardTitle>
            <CardDescription>
              Locais onde você pode armazenar seus produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {depositosDisponiveis && depositosDisponiveis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {depositosDisponiveis.map((deposito) => (
                  <Card key={deposito.deposito_id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{deposito.deposito_nome}</CardTitle>
                      <CardDescription>
                        Franqueado: {deposito.franqueado_nome}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default">Autorizado</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum depósito autorizado encontrado.</p>
                <p className="text-sm">Entre em contato com um franqueado para solicitar acesso.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Estoque por Depósito */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Estoque</CardTitle>
            <CardDescription>
              Visualize onde seus produtos estão armazenados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estoquePorDeposito && Object.keys(estoquePorDeposito).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(estoquePorDeposito).map(([deposito, itens]) => (
                  <div key={deposito}>
                    <h3 className="text-lg font-medium mb-3">{deposito}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.produtos?.nome}
                            </TableCell>
                            <TableCell>{item.lote || "-"}</TableCell>
                            <TableCell>
                              {item.quantidade_atual} {item.produtos?.unidade_medida}
                            </TableCell>
                            <TableCell>
                              R$ {((item.quantidade_atual || 0) * (item.valor_medio || 0)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto em estoque encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Para franqueados: gerenciar acesso */}
        <GerenciarDepositosProdutor />
      </div>
    </AppLayout>
  )
}