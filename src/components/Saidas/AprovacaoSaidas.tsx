import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Clock, Package } from "lucide-react"
import { useSaidasPendentesAprovacao, useAprovarSaida } from "@/hooks/useSaidasAprovacao"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const AprovacaoSaidas = () => {
  const { data: saidasPendentes, isLoading } = useSaidasPendentesAprovacao()
  const aprovarSaida = useAprovarSaida()
  const [observacoes, setObservacoes] = useState("")
  const [saidaSelecionada, setSaidaSelecionada] = useState<string | null>(null)

  const handleAprovar = async (saidaId: string, aprovado: boolean) => {
    try {
      await aprovarSaida.mutateAsync({
        saidaId,
        aprovado,
        observacoes: observacoes || undefined
      })
      
      setObservacoes("")
      setSaidaSelecionada(null)
    } catch (error) {
      console.error("Erro ao aprovar saída:", error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Carregando saídas pendentes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!saidasPendentes || saidasPendentes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma saída pendente de aprovação</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Saídas Pendentes de Aprovação</h2>
        <Badge variant="secondary">{saidasPendentes.length}</Badge>
      </div>

      {saidasPendentes.map((saida) => (
        <Card key={saida.id} className="border-l-4 border-l-warning">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Solicitação de Saída #{saida.id.slice(0, 8)}
              </CardTitle>
              <Badge variant="outline" className="bg-warning/10">
                Aguardando Aprovação
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Tipo:</strong> {saida.tipo_saida === "retirada_deposito" ? "Retirada no Depósito" : "Entrega na Propriedade"}
              </div>
              <div>
                <strong>Data:</strong> {new Date(saida.data_saida).toLocaleDateString()}
              </div>
              <div>
                <strong>Responsável:</strong> {saida.cpf_motorista || "Não informado"}
              </div>
              <div>
                <strong>Valor Total:</strong> R$ {saida.valor_total?.toFixed(2) || "0,00"}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Lista de itens */}
              <div>
                <h4 className="font-medium mb-2">Itens solicitados:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saida.saida_itens?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.produtos?.nome}</TableCell>
                        <TableCell>{item.lote || "-"}</TableCell>
                        <TableCell>
                          {item.quantidade} {item.produtos?.unidade_medida}
                        </TableCell>
                        <TableCell>R$ {item.valor_unitario?.toFixed(2) || "0,00"}</TableCell>
                        <TableCell>R$ {item.valor_total?.toFixed(2) || "0,00"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {saida.observacoes && (
                <div>
                  <h4 className="font-medium mb-1">Observações:</h4>
                  <p className="text-sm text-muted-foreground">{saida.observacoes}</p>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleAprovar(saida.id, true)}
                  disabled={aprovarSaida.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar Saída
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={aprovarSaida.isPending}
                      className="flex-1"
                      onClick={() => setSaidaSelecionada(saida.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reprovar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reprovar Saída</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Informe o motivo da reprovação (opcional):
                      </p>
                      <Textarea
                        placeholder="Motivo da reprovação..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => saidaSelecionada && handleAprovar(saidaSelecionada, false)}
                          disabled={aprovarSaida.isPending}
                          className="flex-1"
                        >
                          Confirmar Reprovação
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}