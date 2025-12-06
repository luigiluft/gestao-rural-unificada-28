import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useUserRole } from "@/hooks/useUserRole"
import { useDepositoFilter } from "@/hooks/useDepositoFilter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { Progress } from "@/components/ui/progress"
import { MapPin, Search, Building, Package, Boxes } from "lucide-react"

const PosicionamentoEstoque = () => {
  const { isCliente } = useUserRole()
  const { depositoId, shouldFilter } = useDepositoFilter()
  const [search, setSearch] = useState("")

  const { data: posicionamento, isLoading } = useQuery({
    queryKey: ["posicionamento-estoque", depositoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      // Buscar estoque agrupado por depósito
      let query = supabase
        .from("entrada_pallets")
        .select(`
          id,
          quantidade_atual,
          entrada_id,
          entradas!inner(
            id,
            user_id,
            deposito_id,
            franquias:deposito_id(id, nome, cidade, estado)
          ),
          entrada_pallet_itens(
            quantidade,
            entrada_itens(
              nome_produto,
              produto_id
            )
          )
        `)
        .gt("quantidade_atual", 0)

      // Filtro por cliente
      if (isCliente) {
        query = query.eq("entradas.user_id", user.user.id)
      }

      // Filtro por depósito específico
      if (shouldFilter && depositoId) {
        query = query.eq("entradas.deposito_id", depositoId)
      }

      const { data, error } = await query

      if (error) throw error

      if (error) throw error

      // Agrupar por depósito
      const depositoMap = new Map<string, {
        deposito: any,
        produtos: Map<string, { nome: string, quantidade: number }>,
        totalPallets: number,
        totalUnidades: number
      }>()

      data?.forEach((pallet: any) => {
        const deposito = pallet.entradas?.franquias
        if (!deposito) return

        if (!depositoMap.has(deposito.id)) {
          depositoMap.set(deposito.id, {
            deposito,
            produtos: new Map(),
            totalPallets: 0,
            totalUnidades: 0
          })
        }

        const entry = depositoMap.get(deposito.id)!
        entry.totalPallets += 1
        entry.totalUnidades += pallet.quantidade_atual || 0

        // Agrupar produtos
        pallet.entrada_pallet_itens?.forEach((item: any) => {
          const nomeProduto = item.entrada_itens?.nome_produto || "Produto não identificado"
          const current = entry.produtos.get(nomeProduto) || { nome: nomeProduto, quantidade: 0 }
          current.quantidade += item.quantidade || 0
          entry.produtos.set(nomeProduto, current)
        })
      })

      return Array.from(depositoMap.values()).map(entry => ({
        ...entry,
        produtos: Array.from(entry.produtos.values())
      }))
    }
  })

  const filteredPosicionamento = posicionamento?.filter((pos: any) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      pos.deposito?.nome?.toLowerCase().includes(searchLower) ||
      pos.deposito?.cidade?.toLowerCase().includes(searchLower) ||
      pos.produtos?.some((p: any) => p.nome?.toLowerCase().includes(searchLower))
    )
  })

  const totalGeral = posicionamento?.reduce((acc, pos) => ({
    pallets: acc.pallets + pos.totalPallets,
    unidades: acc.unidades + pos.totalUnidades
  }), { pallets: 0, unidades: 0 }) || { pallets: 0, unidades: 0 }

  if (isLoading) {
    return <LoadingState text="Carregando posicionamento..." variant="spinner" fullHeight />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Posicionamento de Estoque</h1>
        <p className="text-muted-foreground">Visualize em quais depósitos seu estoque se encontra</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depósitos</p>
                <p className="text-2xl font-bold">{posicionamento?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <Boxes className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Pallets</p>
                <p className="text-2xl font-bold">{totalGeral.pallets.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Unidades</p>
                <p className="text-2xl font-bold">{totalGeral.unidades.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por depósito, cidade ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Depósitos */}
      {!filteredPosicionamento?.length ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<MapPin className="w-8 h-8" />}
              title="Nenhum estoque encontrado"
              description="Não há estoque posicionado em nenhum depósito."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPosicionamento.map((pos: any) => {
            const percentual = totalGeral.unidades > 0 
              ? (pos.totalUnidades / totalGeral.unidades) * 100 
              : 0

            return (
              <Card key={pos.deposito?.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pos.deposito?.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {pos.deposito?.cidade}, {pos.deposito?.estado}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {percentual.toFixed(1)}% do total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Distribuição</span>
                      <span className="font-medium">{pos.totalUnidades.toLocaleString("pt-BR")} unidades</span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-muted-foreground" />
                      <span>{pos.totalPallets} pallets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{pos.produtos?.length || 0} produtos</span>
                    </div>
                  </div>

                  {pos.produtos?.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Produtos neste depósito:</p>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pos.produtos.slice(0, 5).map((prod: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{prod.nome}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {prod.quantidade.toLocaleString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            ))}
                            {pos.produtos.length > 5 && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground text-sm">
                                  + {pos.produtos.length - 5} outros produtos
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PosicionamentoEstoque
