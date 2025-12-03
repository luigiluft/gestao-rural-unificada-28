import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCotacoesLoja } from "@/hooks/useCotacoesLoja";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Store, FileText, Package, LogOut, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  em_analise: { label: "Em Análise", variant: "default" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
};

export default function MinhaContaConsumidor() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { cotacoes = [], isLoading: cotacoesLoading } = useCotacoesLoja();

  // Filtrar cotações do consumidor atual
  const minhasCotacoes = cotacoes.filter((c) => c.consumidor_id === user?.id);

  // Get loja_origem from profile (cast to any since migration just ran)
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
                  Acompanhe o status das suas solicitações de cotação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cotacoesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : minhasCotacoes.length === 0 ? (
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
                    {minhasCotacoes.map((cotacao) => {
                      const status = statusLabels[cotacao.status] || statusLabels.pendente;
                      return (
                        <Card key={cotacao.id} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(cotacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-sm">
                                  {(cotacao as any).cotacao_itens?.length || 0} produto(s) cotado(s)
                                </p>
                                {cotacao.observacoes && (
                                  <p className="text-sm text-muted-foreground">
                                    Obs: {cotacao.observacoes}
                                  </p>
                                )}
                              </div>
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
    </div>
  );
}
