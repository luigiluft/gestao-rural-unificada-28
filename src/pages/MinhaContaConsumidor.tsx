import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCotacoesConsumidor, CotacaoComItens } from "@/hooks/useCotacoesLoja";
import { useConsumidorWishlist } from "@/hooks/useConsumidorWishlist";
import { useConsumidorEnderecos, EnderecoInput } from "@/hooks/useConsumidorEnderecos";
import { useConsumidorPontos } from "@/hooks/useConsumidorPontos";
import { useConsumidorFazendas, FazendaInput } from "@/hooks/useConsumidorFazendas";
import { useLojaDevolucoes } from "@/hooks/useLojaDevolucoes";
import { useConsumidorPedidos } from "@/hooks/useConsumidorPedidos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Store, 
  FileText, 
  Package, 
  LogOut, 
  ExternalLink, 
  Eye,
  CheckCircle,
  XCircle,
  Send,
  History,
  Heart,
  MapPin,
  Gift,
  Tractor,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Star
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Aguardando Análise", variant: "secondary" },
  em_analise: { label: "Em Análise", variant: "default" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
  convertida: { label: "Convertida em Pedido", variant: "default" },
  contra_proposta: { label: "Contra-proposta Recebida", variant: "outline" },
};

const pedidoStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  confirmado: { label: "Confirmado", variant: "default" },
  em_separacao: { label: "Em Separação", variant: "outline" },
  enviado: { label: "Enviado", variant: "default" },
  entregue: { label: "Entregue", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function MinhaContaConsumidor() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  // Hooks
  const { cotacoes = [], isLoading: cotacoesLoading, aceitarProposta, rejeitarProposta, enviarContraProposta, converterEmPedido } = useCotacoesConsumidor();
  const { wishlist, isLoading: wishlistLoading, removeFromWishlist } = useConsumidorWishlist();
  const { enderecos, isLoading: enderecosLoading, addEndereco, updateEndereco, deleteEndereco, isAdding: isAddingEndereco } = useConsumidorEnderecos();
  const { saldo: pontosSaldo, historico: pontosHistorico, isLoading: pontosLoading } = useConsumidorPontos();
  const { fazendas, isLoading: fazendasLoading, addFazenda, updateFazenda, deleteFazenda, isAdding: isAddingFazenda } = useConsumidorFazendas();
  const { devolucoes, isLoading: devolucoesLoading } = useLojaDevolucoes();
  const { pedidos, isLoading: pedidosLoading } = useConsumidorPedidos();

  // Dialog states
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoComItens | null>(null);
  const [modoContraProposta, setModoContraProposta] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [precosPropostos, setPrecosPropostos] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("detalhes");
  
  // Endereco dialog
  const [enderecoDialogOpen, setEnderecoDialogOpen] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<any>(null);
  const [enderecoForm, setEnderecoForm] = useState<EnderecoInput>({
    apelido: "", cep: "", logradouro: "", numero: "", complemento: "",
    bairro: "", cidade: "", estado: "", is_default: false
  });
  
  // Fazenda dialog
  const [fazendaDialogOpen, setFazendaDialogOpen] = useState(false);
  const [editingFazenda, setEditingFazenda] = useState<any>(null);
  const [fazendaForm, setFazendaForm] = useState<FazendaInput>({
    nome: "", tipo: "fazenda", endereco_cep: "", endereco_logradouro: "",
    endereco_numero: "", endereco_complemento: "", endereco_bairro: "",
    endereco_cidade: "", endereco_estado: "", area_hectares: null, car: ""
  });

  const lojaOrigem = (profile as any)?.loja_origem as string | undefined;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const goToStore = () => {
    if (lojaOrigem) {
      navigate(`/loja/${lojaOrigem}`);
    }
  };

  const getMeses = () => {
    const hoje = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const mes = addMonths(hoje, i);
      return format(mes, "MMM/yy", { locale: ptBR });
    });
  };

  const meses = getMeses();

  // Cotacao handlers
  const handleOpenDialog = (cotacao: CotacaoComItens) => {
    setSelectedCotacao(cotacao);
    setMensagem("");
    setModoContraProposta(false);
    setActiveTab("detalhes");
    const precos: Record<string, number> = {};
    cotacao.itens?.forEach(item => {
      precos[item.produto_id] = (cotacao.precos_negociados as Record<string, number>)?.[item.produto_id] 
        || item.produto?.preco_unitario || 0;
    });
    setPrecosPropostos(precos);
  };

  const handleAceitar = () => {
    if (!selectedCotacao) return;
    aceitarProposta({ id: selectedCotacao.id });
    setSelectedCotacao(null);
  };

  const handleRejeitar = () => {
    if (!selectedCotacao) return;
    rejeitarProposta({ id: selectedCotacao.id, mensagem });
    setSelectedCotacao(null);
  };

  const handleEnviarContraProposta = () => {
    if (!selectedCotacao) return;
    enviarContraProposta({ id: selectedCotacao.id, precos: precosPropostos, mensagem });
    setSelectedCotacao(null);
    setModoContraProposta(false);
  };

  const handleConverterEmPedido = () => {
    if (!selectedCotacao) return;
    converterEmPedido({ id: selectedCotacao.id });
    setSelectedCotacao(null);
  };

  // Endereco handlers
  const openEnderecoDialog = (endereco?: any) => {
    if (endereco) {
      setEditingEndereco(endereco);
      setEnderecoForm(endereco);
    } else {
      setEditingEndereco(null);
      setEnderecoForm({ apelido: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", is_default: false });
    }
    setEnderecoDialogOpen(true);
  };

  const handleSaveEndereco = () => {
    if (editingEndereco) {
      updateEndereco({ id: editingEndereco.id, ...enderecoForm });
    } else {
      addEndereco(enderecoForm);
    }
    setEnderecoDialogOpen(false);
  };

  // Fazenda handlers
  const openFazendaDialog = (fazenda?: any) => {
    if (fazenda) {
      setEditingFazenda(fazenda);
      setFazendaForm(fazenda);
    } else {
      setEditingFazenda(null);
      setFazendaForm({ nome: "", tipo: "fazenda", endereco_cep: "", endereco_logradouro: "", endereco_numero: "", endereco_complemento: "", endereco_bairro: "", endereco_cidade: "", endereco_estado: "", area_hectares: null, car: "" });
    }
    setFazendaDialogOpen(true);
  };

  const handleSaveFazenda = () => {
    if (editingFazenda) {
      updateFazenda({ id: editingFazenda.id, ...fazendaForm });
    } else {
      addFazenda(fazendaForm);
    }
    setFazendaDialogOpen(false);
  };

  const podeResponder = selectedCotacao?.status === "contra_proposta";
  const podeConverter = selectedCotacao?.status === "aprovada";

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.nome?.charAt(0)?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{profile?.nome || "Consumidor"}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.loja_origem && (
              <Button variant="outline" size="sm" onClick={goToStore}>
                <Store className="h-4 w-4 mr-2" />
                Ir para Loja
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pedidos" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pedidos" className="gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="cotacoes" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cotações</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Desejos</span>
            </TabsTrigger>
            <TabsTrigger value="enderecos" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Endereços</span>
            </TabsTrigger>
            <TabsTrigger value="pontos" className="gap-1.5">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Pontos</span>
            </TabsTrigger>
            <TabsTrigger value="fazendas" className="gap-1.5">
              <Tractor className="h-4 w-4" />
              <span className="hidden sm:inline">Fazendas</span>
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Devoluções</span>
            </TabsTrigger>
          </TabsList>

          {/* Pedidos Tab */}
          <TabsContent value="pedidos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>Acompanhe suas compras</CardDescription>
              </CardHeader>
              <CardContent>
                {pedidosLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não realizou nenhuma compra</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido) => {
                      const status = pedidoStatusLabels[pedido.status] || pedidoStatusLabels.pendente;
                      return (
                        <Card key={pedido.id} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="font-medium">{pedido.numero_pedido}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">
                                {pedido.itens?.length || 0} item(s)
                              </p>
                              <p className="font-bold text-primary">
                                R$ {pedido.total.toFixed(2)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cotações Tab */}
          <TabsContent value="cotacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Cotações</CardTitle>
                <CardDescription>Acompanhe e negocie suas solicitações</CardDescription>
              </CardHeader>
              <CardContent>
                {cotacoesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : cotacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não enviou nenhuma cotação</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cotacoes.map((cotacao) => {
                      const status = statusLabels[cotacao.status] || statusLabels.pendente;
                      const temAcaoPendente = cotacao.status === "contra_proposta" || cotacao.status === "aprovada";
                      
                      return (
                        <Card key={cotacao.id} className={`${temAcaoPendente ? 'border-primary/50 bg-primary/5' : 'bg-muted/30'}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(cotacao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-sm">{cotacao.itens?.length || 0} produto(s)</p>
                              </div>
                              <Button
                                variant={temAcaoPendente ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOpenDialog(cotacao)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Desejos</CardTitle>
                <CardDescription>Produtos salvos para comprar depois</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sua lista de desejos está vazia</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((item) => (
                      <Card key={item.id} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              {item.produto?.imagens?.[0] ? (
                                <img src={item.produto.imagens[0]} alt="" className="w-full h-full object-cover rounded" />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.produto?.nome_produto}</p>
                              <p className="text-primary font-bold">
                                R$ {(item.produto?.preco_promocional || item.produto?.preco_unitario || 0).toFixed(2)}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFromWishlist(item.produto_id)}>
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

          {/* Endereços Tab */}
          <TabsContent value="enderecos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Catálogo de Endereços</CardTitle>
                  <CardDescription>Gerencie seus endereços de entrega</CardDescription>
                </div>
                <Button size="sm" onClick={() => openEnderecoDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {enderecosLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : enderecos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum endereço cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enderecos.map((endereco) => (
                      <Card key={endereco.id} className={`bg-muted/30 ${endereco.is_default ? 'border-primary' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{endereco.apelido}</p>
                                {endereco.is_default && <Badge variant="secondary">Padrão</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {endereco.logradouro}, {endereco.numero}
                                {endereco.complemento && ` - ${endereco.complemento}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {endereco.bairro}, {endereco.cidade} - {endereco.estado}
                              </p>
                              <p className="text-sm text-muted-foreground">CEP: {endereco.cep}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEnderecoDialog(endereco)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteEndereco(endereco.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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

          {/* Pontos Tab */}
          <TabsContent value="pontos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pontos de Recompensa</CardTitle>
                <CardDescription>Acumule pontos e troque por benefícios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 mb-6 bg-primary/10 rounded-lg">
                  <Gift className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold text-primary">{pontosSaldo}</p>
                  <p className="text-sm text-muted-foreground">pontos disponíveis</p>
                </div>
                
                {pontosLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : pontosHistorico.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma movimentação de pontos</p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium mb-3">Histórico</p>
                    {pontosHistorico.map((mov) => (
                      <div key={mov.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="text-sm">{mov.descricao || mov.origem}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(mov.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <span className={`font-medium ${mov.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.tipo === 'credito' ? '+' : '-'}{mov.quantidade}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fazendas Tab */}
          <TabsContent value="fazendas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Minhas Fazendas/Filiais</CardTitle>
                  <CardDescription>Gerencie suas propriedades rurais</CardDescription>
                </div>
                <Button size="sm" onClick={() => openFazendaDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {fazendasLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : fazendas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tractor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma fazenda cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fazendas.map((fazenda) => (
                      <Card key={fazenda.id} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{fazenda.nome}</p>
                              <Badge variant="secondary" className="mt-1">{fazenda.tipo}</Badge>
                              {fazenda.endereco_cidade && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {fazenda.endereco_cidade} - {fazenda.endereco_estado}
                                </p>
                              )}
                              {fazenda.area_hectares && (
                                <p className="text-sm text-muted-foreground">
                                  Área: {fazenda.area_hectares} ha
                                </p>
                              )}
                              {fazenda.car && (
                                <p className="text-xs text-muted-foreground">CAR: {fazenda.car}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openFazendaDialog(fazenda)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteFazenda(fazenda.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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

          {/* Devoluções Tab */}
          <TabsContent value="devolucoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Devoluções</CardTitle>
                <CardDescription>Acompanhe suas solicitações de devolução</CardDescription>
              </CardHeader>
              <CardContent>
                {devolucoesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : devolucoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma devolução solicitada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devolucoes.map((dev) => (
                      <Card key={dev.id} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Pedido: {dev.pedido?.numero_pedido}</p>
                              <p className="text-sm text-muted-foreground">{dev.motivo}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(dev.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant={dev.status === 'aprovada' ? 'default' : dev.status === 'rejeitada' ? 'destructive' : 'secondary'}>
                              {dev.status}
                            </Badge>
                          </div>
                          {dev.resposta_vendedor && (
                            <div className="mt-3 p-2 bg-background rounded text-sm">
                              <p className="font-medium text-xs">Resposta:</p>
                              <p>{dev.resposta_vendedor}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Endereco Dialog */}
      <Dialog open={enderecoDialogOpen} onOpenChange={setEnderecoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEndereco ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Apelido</Label>
                <Input placeholder="Ex: Casa, Trabalho" value={enderecoForm.apelido} onChange={(e) => setEnderecoForm(p => ({ ...p, apelido: e.target.value }))} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input placeholder="00000-000" value={enderecoForm.cep} onChange={(e) => setEnderecoForm(p => ({ ...p, cep: e.target.value }))} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input placeholder="SP" value={enderecoForm.estado} onChange={(e) => setEnderecoForm(p => ({ ...p, estado: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Cidade</Label>
                <Input value={enderecoForm.cidade} onChange={(e) => setEnderecoForm(p => ({ ...p, cidade: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Logradouro</Label>
                <Input value={enderecoForm.logradouro} onChange={(e) => setEnderecoForm(p => ({ ...p, logradouro: e.target.value }))} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={enderecoForm.numero} onChange={(e) => setEnderecoForm(p => ({ ...p, numero: e.target.value }))} />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input value={enderecoForm.complemento || ''} onChange={(e) => setEnderecoForm(p => ({ ...p, complemento: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Bairro</Label>
                <Input value={enderecoForm.bairro} onChange={(e) => setEnderecoForm(p => ({ ...p, bairro: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={enderecoForm.is_default} onCheckedChange={(v) => setEnderecoForm(p => ({ ...p, is_default: v }))} />
                <Label>Endereço padrão</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnderecoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEndereco} disabled={isAddingEndereco}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fazenda Dialog */}
      <Dialog open={fazendaDialogOpen} onOpenChange={setFazendaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFazenda ? 'Editar Fazenda' : 'Nova Fazenda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input placeholder="Fazenda São João" value={fazendaForm.nome} onChange={(e) => setFazendaForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Tipo</Label>
                <Input placeholder="fazenda, filial, etc" value={fazendaForm.tipo} onChange={(e) => setFazendaForm(p => ({ ...p, tipo: e.target.value }))} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={fazendaForm.endereco_cep || ''} onChange={(e) => setFazendaForm(p => ({ ...p, endereco_cep: e.target.value }))} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={fazendaForm.endereco_cidade || ''} onChange={(e) => setFazendaForm(p => ({ ...p, endereco_cidade: e.target.value }))} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input placeholder="SP" value={fazendaForm.endereco_estado || ''} onChange={(e) => setFazendaForm(p => ({ ...p, endereco_estado: e.target.value }))} />
              </div>
              <div>
                <Label>Área (ha)</Label>
                <Input type="number" value={fazendaForm.area_hectares || ''} onChange={(e) => setFazendaForm(p => ({ ...p, area_hectares: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="col-span-2">
                <Label>CAR (Cadastro Ambiental Rural)</Label>
                <Input value={fazendaForm.car || ''} onChange={(e) => setFazendaForm(p => ({ ...p, car: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFazendaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveFazenda} disabled={isAddingFazenda}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cotacao Dialog - kept from original */}
      <Dialog open={!!selectedCotacao} onOpenChange={() => setSelectedCotacao(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Cotação</DialogTitle>
          </DialogHeader>

          {selectedCotacao && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="historico">
                  <History className="h-4 w-4 mr-1" />
                  Histórico ({selectedCotacao.historico_negociacao?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detalhes" className="space-y-4 mt-4">
                {selectedCotacao.status === "contra_proposta" && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="font-medium text-primary mb-2">O vendedor enviou uma contra-proposta!</p>
                    <p className="text-sm text-muted-foreground">Revise os preços e escolha: aceitar, rejeitar ou enviar nova proposta.</p>
                  </div>
                )}

                {selectedCotacao.status === "aprovada" && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="font-medium text-green-600 mb-2">Cotação aprovada!</p>
                    <p className="text-sm text-muted-foreground">Você pode converter esta cotação em um pedido.</p>
                  </div>
                )}

                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Produtos Solicitados</CardTitle>
                      {podeResponder && !modoContraProposta && (
                        <Button variant="outline" size="sm" onClick={() => setModoContraProposta(true)}>
                          <Send className="h-4 w-4 mr-1" />
                          Enviar Nova Proposta
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 bg-card">Produto</TableHead>
                            <TableHead className="text-center">Preço Proposto</TableHead>
                            {modoContraProposta && <TableHead className="text-center min-w-[100px]">Sua Proposta</TableHead>}
                            {meses.map((mes, i) => <TableHead key={i} className="text-center min-w-[70px]">{mes}</TableHead>)}
                            <TableHead className="text-center">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCotacao.itens?.map((item) => {
                            const quantidades = [item.mes_1, item.mes_2, item.mes_3, item.mes_4, item.mes_5, item.mes_6, item.mes_7, item.mes_8, item.mes_9, item.mes_10, item.mes_11, item.mes_12];
                            const total = quantidades.reduce((a, b) => a + b, 0);
                            const precoNegociado = (selectedCotacao.precos_negociados as Record<string, number>)?.[item.produto_id];

                            return (
                              <TableRow key={item.id}>
                                <TableCell className="sticky left-0 bg-card font-medium">
                                  {item.produto?.nome_produto || "Produto"}
                                  <span className="text-xs text-muted-foreground ml-1">({item.produto?.unidade_medida})</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {precoNegociado ? (
                                    <span className="font-medium text-primary">R$ {precoNegociado.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">R$ {(item.produto?.preco_unitario || 0).toFixed(2)}</span>
                                  )}
                                </TableCell>
                                {modoContraProposta && (
                                  <TableCell className="p-1">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={precosPropostos[item.produto_id] || ""}
                                      onChange={(e) => setPrecosPropostos(prev => ({ ...prev, [item.produto_id]: parseFloat(e.target.value) || 0 }))}
                                      className="h-8 w-24"
                                    />
                                  </TableCell>
                                )}
                                {quantidades.map((q, i) => (
                                  <TableCell key={i} className="text-center text-sm">{q > 0 ? q : '-'}</TableCell>
                                ))}
                                <TableCell className="text-center font-medium">{total}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {(podeResponder || modoContraProposta) && (
                  <div>
                    <Label>Mensagem (opcional)</Label>
                    <Textarea
                      placeholder="Adicione uma mensagem..."
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <div className="space-y-3">
                  {selectedCotacao.historico_negociacao?.map((h, i) => (
                    <div key={i} className={`p-3 rounded-lg ${h.por === 'consumidor' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{h.por === 'consumidor' ? 'Você' : 'Vendedor'}</span>
                        <span>{format(new Date(h.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      </div>
                      <p className="text-sm font-medium capitalize">{h.acao.replace('_', ' ')}</p>
                      {h.mensagem && <p className="text-sm mt-1">{h.mensagem}</p>}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {modoContraProposta ? (
              <>
                <Button variant="outline" onClick={() => setModoContraProposta(false)}>Cancelar</Button>
                <Button onClick={handleEnviarContraProposta}><Send className="h-4 w-4 mr-1" />Enviar Proposta</Button>
              </>
            ) : podeResponder ? (
              <>
                <Button variant="outline" onClick={() => setSelectedCotacao(null)}>Fechar</Button>
                <Button variant="destructive" onClick={handleRejeitar}><XCircle className="h-4 w-4 mr-1" />Rejeitar</Button>
                <Button onClick={handleAceitar}><CheckCircle className="h-4 w-4 mr-1" />Aceitar</Button>
              </>
            ) : podeConverter ? (
              <>
                <Button variant="outline" onClick={() => setSelectedCotacao(null)}>Fechar</Button>
                <Button onClick={handleConverterEmPedido}><Package className="h-4 w-4 mr-1" />Converter em Pedido</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedCotacao(null)}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
