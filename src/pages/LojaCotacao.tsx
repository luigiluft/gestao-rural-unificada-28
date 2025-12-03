import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useLojaAnunciosPublicos } from "@/hooks/useMarketplace"
import { useEnviarCotacao } from "@/hooks/useCotacoesLoja"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send, Store } from "lucide-react"
import { format, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

const LojaCotacao = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading } = useLojaAnunciosPublicos(slug || "")
  const { enviarCotacao, isLoading: isSubmitting } = useEnviarCotacao()

  const [consumidor, setConsumidor] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
  })
  const [observacoes, setObservacoes] = useState("")
  const [quantidades, setQuantidades] = useState<Record<string, number[]>>({})

  const meses = useMemo(() => {
    const hoje = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const mes = addMonths(hoje, i)
      return {
        label: format(mes, "MMM/yy", { locale: ptBR }),
        date: mes,
      }
    })
  }, [])

  const handleQuantidadeChange = (produtoId: string, mesIndex: number, valor: string) => {
    const quantidade = parseInt(valor) || 0
    setQuantidades(prev => {
      const atual = prev[produtoId] || Array(12).fill(0)
      const novo = [...atual]
      novo[mesIndex] = quantidade
      return { ...prev, [produtoId]: novo }
    })
  }

  const getQuantidade = (produtoId: string, mesIndex: number) => {
    return quantidades[produtoId]?.[mesIndex] || 0
  }

  const getTotalProduto = (produtoId: string) => {
    return (quantidades[produtoId] || []).reduce((acc, val) => acc + val, 0)
  }

  const hasAnyQuantity = Object.values(quantidades).some(arr => arr.some(q => q > 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!data?.loja?.cliente_id) return
    if (!hasAnyQuantity) return

    const itens = Object.entries(quantidades)
      .filter(([_, qtds]) => qtds.some(q => q > 0))
      .map(([produto_id, qtds]) => ({
        produto_id,
        quantidades: qtds,
      }))

    await enviarCotacao({
      clienteId: data.loja.cliente_id,
      consumidor: {
        ...consumidor,
        userId: user?.id,
      },
      itens,
      observacoes,
    })

    navigate(`/loja/${slug}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data?.loja) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loja não encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/loja/${slug}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {data.loja.logo_url ? (
                <img src={data.loja.logo_url} alt={data.loja.nome_loja} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <h1 className="font-semibold">{data.loja.nome_loja}</h1>
                <p className="text-sm text-muted-foreground">Solicitar Cotação</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Consumer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={consumidor.nome}
                  onChange={(e) => setConsumidor(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={consumidor.email}
                  onChange={(e) => setConsumidor(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={consumidor.telefone}
                  onChange={(e) => setConsumidor(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={consumidor.empresa}
                  onChange={(e) => setConsumidor(prev => ({ ...prev, empresa: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos e Quantidades por Mês</CardTitle>
              <p className="text-sm text-muted-foreground">
                Informe a quantidade desejada de cada produto para os próximos 12 meses
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium sticky left-0 bg-card min-w-[200px]">Produto</th>
                      {meses.map((mes, i) => (
                        <th key={i} className="text-center p-2 font-medium min-w-[80px]">
                          {mes.label}
                        </th>
                      ))}
                      <th className="text-center p-2 font-medium min-w-[80px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.anuncios.map((produto) => (
                      <tr key={produto.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 sticky left-0 bg-card">
                          <div>
                            <p className="font-medium">{produto.titulo}</p>
                            <p className="text-xs text-muted-foreground">{produto.unidade_venda}</p>
                          </div>
                        </td>
                        {meses.map((_, mesIndex) => (
                          <td key={mesIndex} className="p-1">
                            <Input
                              type="number"
                              min="0"
                              className="w-full h-8 text-center text-sm"
                              value={getQuantidade(produto.id, mesIndex) || ""}
                              onChange={(e) => handleQuantidadeChange(produto.id, mesIndex, e.target.value)}
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center font-medium">
                          {getTotalProduto(produto.id) || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Informações adicionais sobre sua cotação..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/loja/${slug}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!hasAnyQuantity || !consumidor.nome || !consumidor.email || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Enviar Cotação"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default LojaCotacao
