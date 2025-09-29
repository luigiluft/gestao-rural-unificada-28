import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, CheckCircle } from "lucide-react"
import { PlanejamentoPallets } from "@/components/Entradas/PlanejamentoPallets"
import { useEntradasPendentes, useAtualizarStatusEntrada } from "@/hooks/useEntradasPendentes"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

export default function PlanejamentoPalletsPage() {
  const { entradaId } = useParams<{ entradaId: string }>()
  const navigate = useNavigate()
  const { data: entradas, isLoading } = useEntradasPendentes()
  const atualizarStatus = useAtualizarStatusEntrada()

  const [entrada, setEntrada] = useState<any>(null)

  useEffect(() => {
    if (entradas && entradaId) {
      const entradaEncontrada = entradas.find((e: any) => e.id === entradaId)
      setEntrada(entradaEncontrada)
    }
  }, [entradas, entradaId])

  useEffect(() => {
    document.title = "Planejamento de Pallets - AgroHub"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Monte os pallets com os produtos da entrada')
    }
  }, [])

  const handleFinalizarPlanejamento = async () => {
    if (!entrada) return

    try {
      await atualizarStatus.mutateAsync({
        entradaId: entrada.id,
        novoStatus: 'confirmado',
        observacoes: 'Planejamento de pallets finalizado'
      })

      toast({
        title: "Planejamento Finalizado",
        description: "Os pallets foram planejados e a entrada foi enviada para alocação.",
      })

      // Fechar a aba ou redirecionar
      window.close()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar planejamento. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!entrada) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/entradas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Entrada não encontrada</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">A entrada solicitada não foi encontrada ou não está disponível para planejamento.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (entrada.status_aprovacao !== 'planejamento') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/entradas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Status Inválido</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Esta entrada não está no status de planejamento. Status atual: {entrada.status_aprovacao}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.close()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Planejamento de Pallets
            </h1>
            <p className="text-muted-foreground">
              NFe {entrada.numero_nfe || 'S/N'} - {entrada.profiles?.nome}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleFinalizarPlanejamento}
          disabled={atualizarStatus.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {atualizarStatus.isPending ? "Finalizando..." : "Finalizar Planejamento"}
        </Button>
      </div>

      {/* Informações da Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações da Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Data de Entrada:</strong> {format(new Date(entrada.data_entrada), 'dd/MM/yyyy')}
            </div>
            <div>
              <strong>Valor Total:</strong> R$ {entrada.valor_total?.toFixed(2) || '0,00'}
            </div>
            <div>
              <strong>Fornecedor:</strong> {entrada.fornecedores?.nome || 'N/A'}
            </div>
            <div>
              <strong>Franquia:</strong> {entrada.franquias?.nome || 'N/A'}
            </div>
            <div>
              <strong>Itens:</strong> {entrada.entrada_itens?.length || 0} produto(s)
            </div>
            <div>
              <Badge variant="secondary" className="w-fit">
                Status: Planejamento
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Disponíveis para Alocação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entrada.entrada_itens?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                <div>
                  <span className="font-medium">{item.produtos?.nome || item.nome_produto}</span>
                  {(item.produtos?.codigo || item.codigo_produto) && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.produtos?.codigo || item.codigo_produto})
                    </span>
                  )}
                  {item.lote && (
                    <Badge variant="outline" className="ml-2">Lote: {item.lote}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{item.quantidade} unidades</Badge>
                  <span className="text-sm text-muted-foreground">
                    R$ {item.valor_unitario?.toFixed(2) || '0,00'}/un
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Componente de Planejamento de Pallets */}
      <PlanejamentoPallets 
        entradaId={entrada.id}
        entradaItens={entrada.entrada_itens?.map((item: any) => ({
          id: item.id,
          nome_produto: item.produtos?.nome || item.nome_produto,
          codigo_produto: item.produtos?.codigo || item.codigo_produto,
          quantidade: item.quantidade,
          lote: item.lote,
          produto_id: item.produto_id
        })) || []}
      />
    </div>
  )
}