import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { useConsumidorPedidos } from "@/hooks/useConsumidorPedidos"
import { useCotacoesConsumidor } from "@/hooks/useCotacoesLoja"
import { useConsumidorWishlist } from "@/hooks/useConsumidorWishlist"
import { useConsumidorEnderecos, type ConsumidorEndereco } from "@/hooks/useConsumidorEnderecos"
import { useConsumidorPontos } from "@/hooks/useConsumidorPontos"
import { useConsumidorFazendas, type ConsumidorFazenda } from "@/hooks/useConsumidorFazendas"
import { useLojaDevolucoes } from "@/hooks/useLojaDevolucoes"
import { CarrinhoDrawer } from "@/components/Marketplace/CarrinhoDrawer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Gift, 
  FileText,
  RefreshCw,
  LogOut,
  Loader2,
  Package,
  Plus,
  Edit,
  Trash2,
  Tractor,
  ArrowLeft,
  Store
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MarketplaceMinhaContaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab") || "pedidos"
  const { user, logout } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  
  // Hooks de dados
  const { pedidos, isLoading: pedidosLoading } = useConsumidorPedidos()
  const { cotacoes, isLoading: cotacoesLoading, aceitarProposta, rejeitarProposta, enviarContraProposta, editarQuantidades } = useCotacoesConsumidor()
  const { wishlist, isLoading: wishlistLoading, removeFromWishlist } = useConsumidorWishlist()
  const { enderecos, isLoading: enderecosLoading, addEndereco, updateEndereco, deleteEndereco } = useConsumidorEnderecos()
  const { saldo: pontosAtual, historico, isLoading: pontosLoading } = useConsumidorPontos()
  const { fazendas, isLoading: fazendasLoading, addFazenda, updateFazenda, deleteFazenda } = useConsumidorFazendas()
  const { devolucoes, isLoading: devolucoesLoading } = useLojaDevolucoes()

  // State para modais
  const [enderecoDialog, setEnderecoDialog] = useState(false)
  const [fazendaDialog, setFazendaDialog] = useState(false)
  const [editingEndereco, setEditingEndereco] = useState<ConsumidorEndereco | null>(null)
  const [editingFazenda, setEditingFazenda] = useState<ConsumidorFazenda | null>(null)

  // Forms
  const [enderecoForm, setEnderecoForm] = useState({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  })

  const [fazendaForm, setFazendaForm] = useState({
    nome: '',
    tipo: 'fazenda',
    car: '',
    area_hectares: '',
    endereco_cep: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: ''
  })

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Você precisa fazer login para acessar sua conta.</p>
        <Button onClick={() => navigate('/marketplace/auth')}>
          Fazer Login
        </Button>
      </div>
    )
  }

  const handleSaveEndereco = () => {
    if (editingEndereco) {
      updateEndereco({ ...enderecoForm, id: editingEndereco.id } as ConsumidorEndereco)
    } else {
      addEndereco(enderecoForm as Omit<ConsumidorEndereco, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
    }
    setEnderecoDialog(false)
    setEditingEndereco(null)
    setEnderecoForm({ apelido: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  }

  const handleSaveFazenda = () => {
    const fazendaData = {
      ...fazendaForm,
      area_hectares: fazendaForm.area_hectares ? parseFloat(fazendaForm.area_hectares) : null
    }
    if (editingFazenda) {
      updateFazenda({ ...fazendaData, id: editingFazenda.id } as ConsumidorFazenda)
    } else {
      addFazenda(fazendaData as Omit<ConsumidorFazenda, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
    }
    setFazendaDialog(false)
    setEditingFazenda(null)
    setFazendaForm({ nome: '', tipo: 'fazenda', car: '', area_hectares: '', endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_complemento: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '' })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/marketplace')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pendente': { label: 'Pendente', variant: 'secondary' },
      'em_analise': { label: 'Em Análise', variant: 'default' },
      'aprovada': { label: 'Aprovada', variant: 'default' },
      'rejeitada': { label: 'Rejeitada', variant: 'destructive' },
      'convertida': { label: 'Convertida', variant: 'default' },
      'contra_proposta': { label: 'Aguardando sua resposta', variant: 'outline' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/marketplace" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ArrowLeft className="h-5 w-5" />
            AgroHub
          </Link>
          <div className="flex items-center gap-3">
            <CarrinhoDrawer />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header de perfil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.nome || 'Minha Conta'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue={tabFromUrl} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pedidos" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="cotacoes" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cotações</span>
            </TabsTrigger>
            <TabsTrigger value="desejos" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Desejos</span>
            </TabsTrigger>
            <TabsTrigger value="enderecos" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Endereços</span>
            </TabsTrigger>
            <TabsTrigger value="pontos" className="gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Pontos</span>
            </TabsTrigger>
            <TabsTrigger value="fazendas" className="gap-2">
              <Tractor className="h-4 w-4" />
              <span className="hidden sm:inline">Fazendas</span>
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Devoluções</span>
            </TabsTrigger>
          </TabsList>

          {/* Pedidos */}
          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>Acompanhe seus pedidos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                {pedidosLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não fez nenhum pedido</p>
                    <Button className="mt-4" onClick={() => navigate('/marketplace')}>
                      Explorar Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido) => (
                      <Card key={pedido.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Pedido #{pedido.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge>{pedido.status}</Badge>
                              <p className="text-sm font-medium mt-1">R$ {pedido.total.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cotações */}
          <TabsContent value="cotacoes">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Cotações</CardTitle>
                <CardDescription>Gerencie suas cotações e negociações</CardDescription>
              </CardHeader>
              <CardContent>
                {cotacoesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : cotacoes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não solicitou nenhuma cotação</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cotacoes.map((cotacao) => (
                      <CotacaoCard 
                        key={cotacao.id} 
                        cotacao={cotacao} 
                        onAceitar={() => aceitarProposta({ id: cotacao.id })}
                        onRejeitar={(msg) => rejeitarProposta({ id: cotacao.id, mensagem: msg })}
                        onEditarQuantidades={(itens) => editarQuantidades({ id: cotacao.id, itens })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Desejos */}
          <TabsContent value="desejos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Desejos</CardTitle>
                <CardDescription>Produtos que você salvou para depois</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Sua lista de desejos está vazia</p>
                    <Button className="mt-4" onClick={() => navigate('/marketplace')}>
                      Explorar Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{item.produto?.nome_produto}</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {item.produto?.preco_unitario?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeFromWishlist(item.produto_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endereços */}
          <TabsContent value="enderecos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Meus Endereços</CardTitle>
                  <CardDescription>Gerencie seus endereços de entrega</CardDescription>
                </div>
                <Dialog open={enderecoDialog} onOpenChange={setEnderecoDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingEndereco(null)
                      setEnderecoForm({ apelido: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Endereço
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingEndereco ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Apelido</Label>
                        <Input 
                          placeholder="Ex: Casa, Trabalho"
                          value={enderecoForm.apelido}
                          onChange={(e) => setEnderecoForm({ ...enderecoForm, apelido: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>CEP</Label>
                          <Input 
                            value={enderecoForm.cep}
                            onChange={(e) => setEnderecoForm({ ...enderecoForm, cep: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Estado</Label>
                          <Input 
                            value={enderecoForm.estado}
                            onChange={(e) => setEnderecoForm({ ...enderecoForm, estado: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Cidade</Label>
                        <Input 
                          value={enderecoForm.cidade}
                          onChange={(e) => setEnderecoForm({ ...enderecoForm, cidade: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bairro</Label>
                        <Input 
                          value={enderecoForm.bairro}
                          onChange={(e) => setEnderecoForm({ ...enderecoForm, bairro: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 grid gap-2">
                          <Label>Logradouro</Label>
                          <Input 
                            value={enderecoForm.logradouro}
                            onChange={(e) => setEnderecoForm({ ...enderecoForm, logradouro: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Número</Label>
                          <Input 
                            value={enderecoForm.numero}
                            onChange={(e) => setEnderecoForm({ ...enderecoForm, numero: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Complemento</Label>
                        <Input 
                          value={enderecoForm.complemento}
                          onChange={(e) => setEnderecoForm({ ...enderecoForm, complemento: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEnderecoDialog(false)}>Cancelar</Button>
                      <Button onClick={handleSaveEndereco}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {enderecosLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : enderecos.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum endereço cadastrado</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {enderecos.map((endereco) => (
                      <Card key={endereco.id}>
                        <CardContent className="p-4 flex items-start justify-between">
                          <div>
                            <p className="font-medium">{endereco.apelido}</p>
                            <p className="text-sm text-muted-foreground">
                              {endereco.logradouro}, {endereco.numero}
                              {endereco.complemento && ` - ${endereco.complemento}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                            </p>
                            <p className="text-sm text-muted-foreground">CEP: {endereco.cep}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingEndereco(endereco)
                                setEnderecoForm({
                                  apelido: endereco.apelido,
                                  cep: endereco.cep,
                                  logradouro: endereco.logradouro,
                                  numero: endereco.numero,
                                  complemento: endereco.complemento || '',
                                  bairro: endereco.bairro,
                                  cidade: endereco.cidade,
                                  estado: endereco.estado
                                })
                                setEnderecoDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteEndereco(endereco.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pontos */}
          <TabsContent value="pontos">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pontos</CardTitle>
                <CardDescription>Acompanhe seus pontos acumulados</CardDescription>
              </CardHeader>
              <CardContent>
                {pontosLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center p-6 bg-primary/10 rounded-lg">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{pontosAtual || 0}</p>
                        <p className="text-sm text-muted-foreground">pontos disponíveis</p>
                      </div>
                    </div>
                    
                    {historico.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-4">Histórico</h4>
                        <div className="space-y-2">
                          {historico.slice(0, 10).map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b">
                              <div>
                                <p className="text-sm">{item.descricao}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <span className={`font-medium ${item.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                                {item.tipo === 'credito' ? '+' : '-'}{item.quantidade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fazendas */}
          <TabsContent value="fazendas">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Minhas Fazendas</CardTitle>
                  <CardDescription>Gerencie suas propriedades rurais</CardDescription>
                </div>
                <Dialog open={fazendaDialog} onOpenChange={setFazendaDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingFazenda(null)
                      setFazendaForm({ nome: '', tipo: 'fazenda', car: '', area_hectares: '', endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_complemento: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '' })
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fazenda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingFazenda ? 'Editar Fazenda' : 'Nova Fazenda'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid gap-2">
                        <Label>Nome da Propriedade</Label>
                        <Input 
                          value={fazendaForm.nome}
                          onChange={(e) => setFazendaForm({ ...fazendaForm, nome: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Tipo</Label>
                          <Select value={fazendaForm.tipo} onValueChange={(v) => setFazendaForm({ ...fazendaForm, tipo: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fazenda">Fazenda</SelectItem>
                              <SelectItem value="sitio">Sítio</SelectItem>
                              <SelectItem value="chacara">Chácara</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Área (hectares)</Label>
                          <Input 
                            type="number"
                            value={fazendaForm.area_hectares}
                            onChange={(e) => setFazendaForm({ ...fazendaForm, area_hectares: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>CAR (Cadastro Ambiental Rural)</Label>
                        <Input 
                          value={fazendaForm.car}
                          onChange={(e) => setFazendaForm({ ...fazendaForm, car: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>CEP</Label>
                          <Input 
                            value={fazendaForm.endereco_cep}
                            onChange={(e) => setFazendaForm({ ...fazendaForm, endereco_cep: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Estado</Label>
                          <Input 
                            value={fazendaForm.endereco_estado}
                            onChange={(e) => setFazendaForm({ ...fazendaForm, endereco_estado: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Cidade</Label>
                        <Input 
                          value={fazendaForm.endereco_cidade}
                          onChange={(e) => setFazendaForm({ ...fazendaForm, endereco_cidade: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setFazendaDialog(false)}>Cancelar</Button>
                      <Button onClick={handleSaveFazenda}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {fazendasLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : fazendas.length === 0 ? (
                  <div className="text-center py-8">
                    <Tractor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma fazenda cadastrada</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {fazendas.map((fazenda) => (
                      <Card key={fazenda.id}>
                        <CardContent className="p-4 flex items-start justify-between">
                          <div>
                            <p className="font-medium">{fazenda.nome}</p>
                            <p className="text-sm text-muted-foreground capitalize">{fazenda.tipo}</p>
                            {fazenda.area_hectares && (
                              <p className="text-sm text-muted-foreground">{fazenda.area_hectares} hectares</p>
                            )}
                            {fazenda.car && (
                              <p className="text-sm text-muted-foreground">CAR: {fazenda.car}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingFazenda(fazenda)
                                setFazendaForm({
                                  nome: fazenda.nome,
                                  tipo: fazenda.tipo,
                                  car: fazenda.car || '',
                                  area_hectares: fazenda.area_hectares?.toString() || '',
                                  endereco_cep: fazenda.endereco_cep || '',
                                  endereco_logradouro: fazenda.endereco_logradouro || '',
                                  endereco_numero: fazenda.endereco_numero || '',
                                  endereco_complemento: fazenda.endereco_complemento || '',
                                  endereco_bairro: fazenda.endereco_bairro || '',
                                  endereco_cidade: fazenda.endereco_cidade || '',
                                  endereco_estado: fazenda.endereco_estado || ''
                                })
                                setFazendaDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteFazenda(fazenda.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devoluções */}
          <TabsContent value="devolucoes">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Devoluções</CardTitle>
                <CardDescription>Acompanhe suas solicitações de devolução</CardDescription>
              </CardHeader>
              <CardContent>
                {devolucoesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : devolucoes.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma devolução solicitada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devolucoes.map((devolucao) => (
                      <Card key={devolucao.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Devolução #{devolucao.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">{devolucao.motivo}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(devolucao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge>{devolucao.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Componente de Card de Cotação com funcionalidade de editar quantidades
function CotacaoCard({ 
  cotacao, 
  onAceitar, 
  onRejeitar,
  onEditarQuantidades 
}: { 
  cotacao: any
  onAceitar: () => void
  onRejeitar: (msg?: string) => void
  onEditarQuantidades: (itens: Array<{ item_id: string; quantidades: number[] }>) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [editedItems, setEditedItems] = useState<Record<string, number[]>>({})
  const [mensagemRejeicao, setMensagemRejeicao] = useState('')
  const [showRejeicaoDialog, setShowRejeicaoDialog] = useState(false)

  const initEditMode = () => {
    const initialItems: Record<string, number[]> = {}
    cotacao.itens?.forEach((item: any) => {
      initialItems[item.id] = [
        item.mes_1, item.mes_2, item.mes_3, item.mes_4,
        item.mes_5, item.mes_6, item.mes_7, item.mes_8,
        item.mes_9, item.mes_10, item.mes_11, item.mes_12
      ]
    })
    setEditedItems(initialItems)
    setEditMode(true)
  }

  const handleQuantidadeChange = (itemId: string, mesIndex: number, value: number) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((v, i) => i === mesIndex ? Math.max(0, value) : v)
    }))
  }

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: prev[itemId].map(() => 0)
    }))
  }

  const handleSaveEdit = () => {
    const itensParaEnviar = Object.entries(editedItems).map(([item_id, quantidades]) => ({
      item_id,
      quantidades
    }))
    onEditarQuantidades(itensParaEnviar)
    setEditMode(false)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pendente': { label: 'Pendente', variant: 'secondary' },
      'em_analise': { label: 'Em Análise', variant: 'default' },
      'aprovada': { label: 'Aprovada', variant: 'default' },
      'rejeitada': { label: 'Rejeitada', variant: 'destructive' },
      'convertida': { label: 'Convertida', variant: 'default' },
      'contra_proposta': { label: 'Aguardando sua resposta', variant: 'outline' }
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium">Cotação #{cotacao.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(cotacao.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          {getStatusBadge(cotacao.status)}
        </div>

        {/* Itens da cotação */}
        <div className="space-y-3 mb-4">
          {cotacao.itens?.map((item: any) => {
            const quantidades = editMode ? editedItems[item.id] : [
              item.mes_1, item.mes_2, item.mes_3, item.mes_4,
              item.mes_5, item.mes_6, item.mes_7, item.mes_8,
              item.mes_9, item.mes_10, item.mes_11, item.mes_12
            ]
            const totalQtd = quantidades?.reduce((a: number, b: number) => a + b, 0) || 0
            const precoNegociado = cotacao.precos_negociados?.[item.produto_id]
            const isRemoved = editMode && quantidades?.every((q: number) => q === 0)

            return (
              <div key={item.id} className={`p-3 bg-muted/50 rounded-lg ${isRemoved ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{item.produto?.nome_produto}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {totalQtd} {item.produto?.unidade_medida}
                      {precoNegociado && (
                        <span className="ml-2 text-primary font-medium">
                          R$ {precoNegociado.toFixed(2)}/{item.produto?.unidade_medida}
                        </span>
                      )}
                    </p>
                  </div>
                  {editMode && !isRemoved && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                
                {editMode && !isRemoved && (
                  <div className="grid grid-cols-6 gap-1 mt-2">
                    {meses.map((mes, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-xs text-muted-foreground">{mes}</p>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-xs px-1 text-center"
                          value={quantidades?.[idx] || 0}
                          onChange={(e) => handleQuantidadeChange(item.id, idx, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ações baseadas no status */}
        {cotacao.status === 'contra_proposta' && (
          <div className="flex flex-wrap gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Enviar para Reanálise</Button>
              </>
            ) : (
              <>
                <Button variant="default" onClick={onAceitar}>Aceitar Proposta</Button>
                <Button variant="outline" onClick={initEditMode}>Editar Quantidades</Button>
                <Dialog open={showRejeicaoDialog} onOpenChange={setShowRejeicaoDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Rejeitar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeitar Cotação</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Label>Motivo (opcional)</Label>
                      <Input 
                        placeholder="Informe o motivo da rejeição"
                        value={mensagemRejeicao}
                        onChange={(e) => setMensagemRejeicao(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowRejeicaoDialog(false)}>Cancelar</Button>
                      <Button variant="destructive" onClick={() => {
                        onRejeitar(mensagemRejeicao || undefined)
                        setShowRejeicaoDialog(false)
                      }}>
                        Confirmar Rejeição
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
