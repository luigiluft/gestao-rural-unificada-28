import { useState } from "react"
import { useLojaConfiguracao } from "@/hooks/useLojaConfiguracao"
import { useLojaAnuncios } from "@/hooks/useLojaAnuncios"
import { useCliente } from "@/contexts/ClienteContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Store, Package, Plus, ExternalLink, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnuncioForm } from "@/components/Loja/AnuncioForm"
import { AnuncioCard } from "@/components/Loja/AnuncioCard"

export default function MinhaLoja() {
  const { selectedCliente } = useCliente()
  const { configuracao, isLoading, habilitarLoja, isHabilitando } = useLojaConfiguracao()
  const { anuncios, isLoading: loadingAnuncios } = useLojaAnuncios()
  
  const [nomeLoja, setNomeLoja] = useState("")
  const [participarMarketplace, setParticiparMarketplace] = useState(true)
  const [showNovoAnuncio, setShowNovoAnuncio] = useState(false)

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
                  <li>✓ Gerenciamento de anúncios e preços</li>
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

  // Dashboard da loja - apenas anúncios
  const anunciosAtivos = anuncios.filter(a => a.ativo).length

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
            Gerencie seus anúncios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {configuracao.slug && (
            <Button variant="outline" asChild>
              <a
                href={`/loja/${configuracao.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Loja
              </a>
            </Button>
          )}
          <Dialog open={showNovoAnuncio} onOpenChange={setShowNovoAnuncio}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Anúncio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Anúncio</DialogTitle>
              </DialogHeader>
              <AnuncioForm onSuccess={() => setShowNovoAnuncio(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{anunciosAtivos}</p>
                <p className="text-sm text-muted-foreground">Anúncios Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Badge variant={configuracao.participar_marketplace ? "default" : "secondary"}>
                {configuracao.participar_marketplace ? "No Marketplace" : "Loja Própria"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anúncios */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Anúncios</h2>
        {loadingAnuncios ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : anuncios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum anúncio ainda</h3>
              <p className="text-muted-foreground mb-4">Crie seu primeiro anúncio para começar a vender</p>
              <Button onClick={() => setShowNovoAnuncio(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Anúncio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {anuncios.map((anuncio) => (
              <AnuncioCard key={anuncio.id} anuncio={anuncio} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
