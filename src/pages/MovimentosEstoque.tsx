import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "@/hooks/useDepositoFilter"
import { useUserRole } from "@/hooks/useUserRole"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { ArrowDownToLine, ArrowUpFromLine, Search, FileText, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const MovimentosEstoque = () => {
  const { depositoId, shouldFilter } = useDepositoFilter()
  const { isCliente } = useUserRole()
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  const { data: movimentos, isLoading } = useQuery({
    queryKey: ["movimentos-estoque", depositoId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      let query = supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos:produto_id(nome),
          franquias:deposito_id(nome)
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(500)

      // Filtro por cliente
      if (isCliente) {
        query = query.eq("user_id", user.user.id)
      }

      // Filtro por depósito
      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      // Filtro por data
      if (dateRange.from) {
        query = query.gte("data_movimentacao", dateRange.from.toISOString())
      }
      if (dateRange.to) {
        query = query.lte("data_movimentacao", dateRange.to.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }
  })

  const filteredMovimentos = movimentos?.filter((mov: any) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      mov.produtos?.nome?.toLowerCase().includes(searchLower) ||
      mov.lote?.toLowerCase().includes(searchLower) ||
      mov.franquias?.nome?.toLowerCase().includes(searchLower) ||
      mov.referencia_tipo?.toLowerCase().includes(searchLower)
    )
  })

  const getTipoMovimentoBadge = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><ArrowDownToLine className="w-3 h-3 mr-1" /> Entrada</Badge>
      case "saida":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><ArrowUpFromLine className="w-3 h-3 mr-1" /> Saída</Badge>
      case "ajuste":
        return <Badge variant="outline">Ajuste</Badge>
      case "transferencia":
        return <Badge variant="secondary">Transferência</Badge>
      case "alocacao_automatica":
        return <Badge variant="secondary">Alocação Auto</Badge>
      default:
        return <Badge variant="outline">{tipo || "N/A"}</Badge>
    }
  }

  if (isLoading) {
    return <LoadingState text="Carregando movimentações..." variant="spinner" fullHeight />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentos de Estoque (Kardex)</h1>
        <p className="text-muted-foreground">Histórico completo de entradas, saídas e ajustes de estoque</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, lote ou documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <Button variant="outline" onClick={() => { setSearch(""); setDateRange({ from: undefined, to: undefined }) }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Movimentações ({filteredMovimentos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredMovimentos?.length ? (
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title="Nenhuma movimentação encontrada"
              description="Não há registros de movimentação para os filtros selecionados."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Depósito</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimentos.map((mov: any) => (
                    <TableRow key={mov.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(mov.data_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getTipoMovimentoBadge(mov.tipo_movimentacao)}</TableCell>
                      <TableCell className="font-medium">{mov.produtos?.nome || "-"}</TableCell>
                      <TableCell>{mov.lote || "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={mov.quantidade > 0 ? "text-green-600" : "text-red-600"}>
                          {mov.quantidade > 0 ? "+" : ""}
                          {Math.abs(mov.quantidade)?.toLocaleString("pt-BR")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {mov.franquias?.nome || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {mov.referencia_tipo ? `${mov.referencia_tipo}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MovimentosEstoque
