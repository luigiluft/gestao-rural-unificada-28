import { useState } from "react"
import { useLojaConfiguracao } from "@/hooks/useLojaConfiguracao"
import { useClienteProdutos, ClienteProduto } from "@/hooks/useClienteProdutos"
import { useCliente } from "@/contexts/ClienteContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Package, ExternalLink, Loader2, Search, Settings2, Check, X, FileText } from "lucide-react"
import { ProdutoConfigDialog } from "@/components/Loja/ProdutoConfigDialog"
import CotacoesRecebidas from "@/components/Loja/CotacoesRecebidas"

export default function MinhaLoja() {
  const { selectedCliente } = useCliente()
  const { configuracao, isLoading, habilitarLoja, isHabilitando } = useLojaConfiguracao()
  const { produtos, isLoading: loadingProdutos, updateProduto, isUpdating, toggleMarketplace, toggleLoja } = useClienteProdutos()
  
  const [nomeLoja, setNomeLoja] = useState("")
  const [participarMarketplace, setParticiparMarketplace] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduto, setSelectedProduto] = useState<ClienteProduto | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  if (!selectedCliente) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Selecione uma empresa</h3>
        <p className="text-muted-foreground">Selecione uma empresa no menu superior para gerenciar sua loja</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Se a loja não está habilitada, mostrar tela de ativação
  if (!configuracao?.loja_habilitada) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ative sua Loja Online</CardTitle>
            <CardDescription>
              Comece a vender seus produtos no marketplace AgroHub e/ou em sua loja própria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-loja">Nome da sua loja</Label>
                <Input
                  id="nome-loja"
                  placeholder="Ex: Fazenda São João"
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Este nome será exibido para os compradores
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">Participar do Marketplace AgroHub</p>
                  <p className="text-sm text-muted-foreground">
                    Seus produtos aparecerão na loja principal junto com outros vendedores
                  </p>
                </div>
                <Switch
                  checked={participarMarketplace}
                  onCheckedChange={setParticiparMarketplace}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium text-sm">Você terá acesso a:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Loja própria com URL personalizada</li>
                  <li>✓ Gerenciamento de preços e visibilidade</li>
                  <li>✓ Pedidos viram saídas no OMS automaticamente</li>
                  {participarMarketplace && (
                    <li>✓ Exposição no Marketplace AgroHub</li>
                  )}
                </ul>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!nomeLoja.trim() || isHabilitando}
              onClick={() => {
                habilitarLoja({
                  nome_loja: nomeLoja,
                  participar_marketplace: participarMarketplace,
                })
              }}
            >
              {isHabilitando ? "Ativando..." : "Ativar Minha Loja"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filtrar produtos
  const filteredProdutos = produtos.filter(p => 
    p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_produto?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const produtosAtivosMarketplace = produtos.filter(p => p.ativo_marketplace).length
  const produtosAtivosLoja = produtos.filter(p => p.ativo_loja_propria).length

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            {configuracao.nome_loja || "Minha Loja"}
          </h1>
          <p className="text-muted-foreground">
            Gerencie produtos e cotações da sua loja
          </p>
        </div>
        <div className="flex items-center gap-2">
          {configuracao.slug && (
            <Button variant="outline" asChild>
              <a
                href={`#/loja/${configuracao.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Loja
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="produtos" className="w-full">
        <TabsList>
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="cotacoes" className="gap-2">
            <FileText className="h-4 w-4" />
            Cotações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-6 mt-6">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{produtos.length}</p>
                <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{produtosAtivosMarketplace}</p>
                <p className="text-sm text-muted-foreground">No Marketplace</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Store className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{produtosAtivosLoja}</p>
                <p className="text-sm text-muted-foreground">Na Loja Própria</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Meus Produtos ({produtos.length})</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loadingProdutos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : produtos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Os produtos serão adicionados automaticamente quando você receber entradas de estoque.
              </p>
            </CardContent>
          </Card>
        ) : filteredProdutos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum produto encontrado para "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProdutos.map((produto) => (
              <Card key={produto.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info do produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{produto.nome_produto}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>Código: {produto.codigo_produto || "N/A"}</span>
                        <span>•</span>
                        <span>Unidade: {produto.unidade_medida}</span>
                        {produto.preco_unitario && (
                          <>
                            <span>•</span>
                            <span className="text-foreground font-medium">
                              R$ {produto.preco_unitario.toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                      {produto.categoria && (
                        <Badge variant="outline" className="mt-2">{produto.categoria}</Badge>
                      )}
                    </div>

                    {/* Controles */}
                    <div className="flex items-center gap-4">
                      {/* Toggle Marketplace */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">Marketplace</span>
                        <button
                          onClick={() => toggleMarketplace({ id: produto.id, ativo: !produto.ativo_marketplace })}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            produto.ativo_marketplace 
                              ? "bg-green-500 text-white" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          title={produto.ativo_marketplace ? "Desativar do Marketplace" : "Ativar no Marketplace"}
                        >
                          {produto.ativo_marketplace ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Toggle Loja Própria */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">Loja</span>
                        <button
                          onClick={() => toggleLoja({ id: produto.id, ativo: !produto.ativo_loja_propria })}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            produto.ativo_loja_propria 
                              ? "bg-blue-500 text-white" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          title={produto.ativo_loja_propria ? "Desativar da Loja" : "Ativar na Loja"}
                        >
                          {produto.ativo_loja_propria ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Configurar */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduto(produto)
                          setShowConfigDialog(true)
                        }}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Configurar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de configuração */}
      <ProdutoConfigDialog
        produto={selectedProduto}
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        onSave={(id, data) => updateProduto({ id, data })}
        isSaving={isUpdating}
      />
        </TabsContent>

        <TabsContent value="cotacoes" className="mt-6">
          <CotacoesRecebidas />
        </TabsContent>
      </Tabs>
    </div>
  )
}
