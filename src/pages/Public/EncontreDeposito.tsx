import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Warehouse,
  Shield,
  BarChart3,
  Truck,
  Phone,
} from "lucide-react";
import { PublicBrazilMap } from "@/components/Public/PublicBrazilMap";

const ESTADOS_BRASIL = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

const beneficios = [
  {
    icon: Shield,
    title: "Segurança Garantida",
    description:
      "Armazéns certificados com seguro completo para sua produção.",
  },
  {
    icon: BarChart3,
    title: "Rastreabilidade Total",
    description:
      "Acompanhe seu estoque em tempo real de qualquer lugar.",
  },
  {
    icon: Truck,
    title: "Logística Integrada",
    description:
      "Gestão completa de entregas com comprovantes digitais.",
  },
  {
    icon: Warehouse,
    title: "Flexibilidade",
    description:
      "Contrate apenas o espaço que você precisa, quando precisar.",
  },
];

export default function EncontreDeposito() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("all");

  // Fetch deposits
  const { data: depositos = [], isLoading } = useQuery({
    queryKey: ["depositos-publicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select("id, nome, cidade, estado, tipo_deposito, ativo")
        .eq("ativo", true)
        .order("estado")
        .order("cidade");

      if (error) throw error;
      return data || [];
    },
  });

  // Filter deposits
  const depositosFiltrados = useMemo(() => {
    if (estadoSelecionado === "all") return depositos;
    return depositos.filter((d) => d.estado === estadoSelecionado);
  }, [depositos, estadoSelecionado]);

  const handleQueroArmazenar = (depositoId: string) => {
    if (session) {
      // User is logged in, redirect to complete profile or dashboard
      navigate(`/completar-cadastro?deposito=${depositoId}`);
    } else {
      // Redirect to auth with role=cliente and deposito param
      navigate(`/auth?role=cliente&deposito=${depositoId}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <MapPin className="h-3 w-3 mr-1" />
              Encontre o depósito ideal
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Armazene sua produção com{" "}
              <span className="text-primary">segurança e praticidade</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Encontre um depósito Luft AgroHub na sua região e tenha acesso a
              uma estrutura completa de armazenagem, controle de estoque em
              tempo real e logística integrada.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {ESTADOS_BRASIL.map((estado) => (
                  <SelectItem key={estado.uf} value={estado.uf}>
                    {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Map and List Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <div className="bg-muted/30 rounded-xl p-4 h-[400px] overflow-hidden flex items-center justify-center">
              <PublicBrazilMap />
            </div>

            {/* List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Depósitos disponíveis
                </h2>
                <Badge variant="outline">
                  {depositosFiltrados.length} encontrado(s)
                </Badge>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando depósitos...
                </div>
              ) : depositosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum depósito encontrado na região selecionada.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tente ajustar os filtros ou entre em contato conosco.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {depositosFiltrados.map((deposito) => (
                    <Card
                      key={deposito.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-primary" />
                              <h3 className="font-medium">{deposito.nome}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {deposito.cidade}, {deposito.estado}
                            </p>
                            <Badge
                              variant={
                                deposito.tipo_deposito === "franquia"
                                  ? "default"
                                  : "secondary"
                              }
                              className="mt-2 text-xs"
                            >
                              {deposito.tipo_deposito === "franquia"
                                ? "Franquia"
                                : "Filial"}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleQueroArmazenar(deposito.id)}
                          >
                            Quero armazenar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Por que armazenar com a Luft AgroHub?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma solução completa para armazenagem e gestão
              logística da sua produção.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <beneficio.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{beneficio.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {beneficio.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Como funciona?
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Escolha o depósito",
                  description:
                    "Selecione o depósito mais próximo da sua produção ou destino.",
                },
                {
                  step: "2",
                  title: "Faça seu cadastro",
                  description:
                    "Crie sua conta gratuitamente e complete seus dados.",
                },
                {
                  step: "3",
                  title: "Envie sua produção",
                  description:
                    "Agende o recebimento e envie sua mercadoria para armazenagem.",
                },
                {
                  step: "4",
                  title: "Acompanhe em tempo real",
                  description:
                    "Controle seu estoque e gerencie entregas pelo sistema.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Não encontrou um depósito na sua região?
          </h2>
          <p className="mb-8 opacity-90 max-w-xl mx-auto">
            Entre em contato conosco e saiba quando teremos um depósito
            disponível perto de você.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/site/contato")}
            >
              <Phone className="h-4 w-4 mr-2" />
              Falar com consultor
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/site/seja-franqueado")}
            >
              <Warehouse className="h-4 w-4 mr-2" />
              Seja um franqueado
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
