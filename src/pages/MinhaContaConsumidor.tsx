import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCotacoesConsumidor, CotacaoComItens } from "@/hooks/useCotacoesLoja";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Clock,
  ArrowRight,
  ShoppingCart
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

export default function MinhaContaConsumidor() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { 
    cotacoes = [], 
    isLoading: cotacoesLoading,
    aceitarProposta,
    isAceitando,
    rejeitarProposta,
    isRejeitando,
    enviarContraProposta,
    isEnviandoProposta,
    converterEmPedido,
    isConvertendo
  } = useCotacoesConsumidor();

  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoComItens | null>(null);
  const [modoContraProposta, setModoContraProposta] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [precosPropostos, setPrecosPropostos] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("detalhes");

  // Get loja_origem from profile
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

  const handleOpenDialog = (cotacao: CotacaoComItens) => {
    setSelectedCotacao(cotacao);
    setMensagem("");
    setModoContraProposta(false);
    setActiveTab("detalhes");
    // Inicializar preços com os negociados ou originais
    const precos: Record<string, number> = {};
    cotacao.itens?.forEach(item => {
      precos[item.produto_id] = (cotacao.precos_negociados as Record<string, number>)?.[item.produto_id] 
        || item.produto?.preco_unitario 
        || 0;
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
    enviarContraProposta({ 
      id: selectedCotacao.id, 
      precos: precosPropostos,
      mensagem 
    });
    setSelectedCotacao(null);
    setModoContraProposta(false);
  };

  const handleConverterEmPedido = () => {
    if (!selectedCotacao) return;
    converterEmPedido({ id: selectedCotacao.id });
    setSelectedCotacao(null);
  };

  // Pode responder se recebeu contra-proposta do vendedor
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
        <Tabs defaultValue="cotacoes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cotacoes" className="gap-2">
              <FileText className="h-4 w-4" />
              Minhas Cotações
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-2">
              <Package className="h-4 w-4" />
              Meus Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Cotações</CardTitle>
                <CardDescription>
                  Acompanhe e negocie suas solicitações de cotação
                </CardDescription>
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
                    {profile?.loja_origem && (
                      <Button variant="link" onClick={goToStore} className="mt-2">
                        Ir para a loja e solicitar cotação
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cotacoes.map((cotacao) => {
                      const status = statusLabels[cotacao.status] || statusLabels.pendente;
                      const temAcaoPendente = cotacao.status === "contra_proposta" || cotacao.status === "aprovada";
                      
                      return (
                        <Card 
                          key={cotacao.id} 
                          className={`${temAcaoPendente ? 'border-primary/50 bg-primary/5' : 'bg-muted/30'}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(cotacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                  {cotacao.versao > 1 && (
                                    <Badge variant="outline">v{cotacao.versao}</Badge>
                                  )}
                                </div>
                                <p className="text-sm">
                                  {cotacao.itens?.length || 0} produto(s) cotado(s)
                                </p>
                                {temAcaoPendente && (
                                  <p className="text-sm font-medium text-primary">
                                    ⚠️ Ação necessária - clique para ver detalhes
                                  </p>
                                )}
                              </div>
                              <Button
                                variant={temAcaoPendente ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOpenDialog(cotacao)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {temAcaoPendente ? "Responder" : "Ver Detalhes"}
                              </Button>
                            </div>
                            {cotacao.resposta_cliente && (
                              <div className="mt-3 p-3 bg-background rounded border">
                                <p className="text-sm font-medium">Resposta do vendedor:</p>
                                <p className="text-sm text-muted-foreground">{cotacao.resposta_cliente}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>
                  Histórico de compras realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não realizou nenhuma compra</p>
                  {profile?.loja_origem && (
                    <Button variant="link" onClick={goToStore} className="mt-2">
                      Ir para a loja e fazer uma compra
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de Cotação */}
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
                {/* Status Info */}
                {selectedCotacao.status === "contra_proposta" && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="font-medium text-primary mb-2">
                      O vendedor enviou uma contra-proposta!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revise os preços propostos e escolha: aceitar, rejeitar ou enviar uma nova proposta.
                    </p>
                  </div>
                )}

                {selectedCotacao.status === "aprovada" && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="font-medium text-green-600 mb-2">
                      Cotação aprovada!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Você pode converter esta cotação em um pedido.
                    </p>
                  </div>
                )}

                {/* Products Table */}
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Produtos Solicitados</CardTitle>
                      {podeResponder && !modoContraProposta && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setModoContraProposta(true)}
                        >
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
                            {modoContraProposta && (
                              <TableHead className="text-center min-w-[100px]">Sua Proposta</TableHead>
                            )}
                            {meses.map((mes, i) => (
                              <TableHead key={i} className="text-center min-w-[70px]">
                                {mes}
                              </TableHead>
                            ))}
                            <TableHead className="text-center">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCotacao.itens?.map((item) => {
                            const quantidades = [
                              item.mes_1, item.mes_2, item.mes_3, item.mes_4,
                              item.mes_5, item.mes_6, item.mes_7, item.mes_8,
                              item.mes_9, item.mes_10, item.mes_11, item.mes_12
                            ];
                            const total = quantidades.reduce((a, b) => a + b, 0);
                            const precoNegociado = (selectedCotacao.precos_negociados as Record<string, number>)?.[item.produto_id];

                            return (
                              <TableRow key={item.id}>
                                <TableCell className="sticky left-0 bg-card font-medium">
                                  {item.produto?.nome_produto || "Produto"}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({item.produto?.unidade_medida})
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {precoNegociado ? (
                                    <span className="font-medium text-primary">
                                      R$ {precoNegociado.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      R$ {(item.produto?.preco_unitario || 0).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>
                                {modoContraProposta && (
                                  <TableCell className="p-1">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={precosPropostos[item.produto_id] || ""}
                                      onChange={(e) => setPrecosPropostos(prev => ({
                                        ...prev,
                                        [item.produto_id]: parseFloat(e.target.value) || 0
                                      }))}
                                      className="h-8 w-24"
                                    />
                                  </TableCell>
                                )}
                                {quantidades.map((qtd, i) => (
                                  <TableCell key={i} className="text-center">
                                    {qtd > 0 ? qtd : "-"}
                                  </TableCell>
                                ))}
                                <TableCell className="text-center font-medium">
                                  {total}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Area */}
                {(podeResponder || modoContraProposta) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {modoContraProposta ? "Mensagem (opcional)" : "Motivo da rejeição (se aplicável)"}
                    </Label>
                    <Textarea
                      placeholder="Adicione uma mensagem..."
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {selectedCotacao.resposta_cliente && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Última resposta do vendedor:</p>
                    <p className="text-sm">{selectedCotacao.resposta_cliente}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {selectedCotacao.historico_negociacao?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum histórico de negociação
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {selectedCotacao.historico_negociacao?.map((item, index) => (
                          <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-medium text-primary">v{item.versao}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={item.por === 'consumidor' ? 'default' : 'secondary'}>
                                  {item.por === 'consumidor' ? 'Você' : 'Vendedor'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-sm font-medium capitalize">
                                {item.acao.replace('_', ' ')}
                              </p>
                              {item.mensagem && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  "{item.mensagem}"
                                </p>
                              )}
                              {item.precos && Object.keys(item.precos).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Preços: {Object.values(item.precos).map(p => `R$ ${p.toFixed(2)}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {modoContraProposta ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModoContraProposta(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEnviarContraProposta}
                  disabled={isEnviandoProposta}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar Proposta
                </Button>
              </>
            ) : podeConverter ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCotacao(null)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleConverterEmPedido}
                  disabled={isConvertendo}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Converter em Pedido
                </Button>
              </>
            ) : podeResponder ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejeitar}
                  disabled={isRejeitando}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  onClick={handleAceitar}
                  disabled={isAceitando}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aceitar Proposta
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedCotacao(null)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
