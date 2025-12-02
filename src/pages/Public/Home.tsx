import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Warehouse, 
  Truck, 
  BarChart3, 
  Shield, 
  Users, 
  MapPin,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Warehouse,
      title: "Armazenagem Inteligente",
      description: "Rede de depósitos certificados em todo o Brasil com tecnologia WMS de ponta."
    },
    {
      icon: Truck,
      title: "Logística Integrada",
      description: "Gestão completa de transporte com rastreamento em tempo real e otimização de rotas."
    },
    {
      icon: BarChart3,
      title: "Gestão Fiscal Completa",
      description: "Emissão automática de NF-e, CT-e e toda documentação fiscal necessária."
    },
    {
      icon: Shield,
      title: "Segurança e Rastreabilidade",
      description: "Controle total do estoque com rastreabilidade por lote e validade."
    }
  ];

  const stats = [
    { value: "50+", label: "Depósitos" },
    { value: "1.000+", label: "Clientes ativos" },
    { value: "500k+", label: "Pallets gerenciados" },
    { value: "15", label: "Estados atendidos" }
  ];

  const clientTypes = [
    { title: "Produtores Rurais", description: "Armazene sua produção com segurança e rastreabilidade completa." },
    { title: "Indústrias", description: "Distribua seus produtos com eficiência através da nossa rede logística." },
    { title: "Revendas de Insumos", description: "Gerencie estoque em múltiplos pontos de distribuição." },
    { title: "Cooperativas", description: "Centralize a gestão de armazenagem de todos os cooperados." }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                A logística rural do futuro,{" "}
                <span className="text-primary">agora</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Conectamos produtores, indústrias e revendas a uma rede de armazenagem 
                inteligente. Simplifique sua operação logística com tecnologia de ponta.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Começar agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/site/como-funciona">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Como funciona
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center p-4">
                      <div className="text-3xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Mobile */}
      <section className="lg:hidden bg-muted/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Tudo que você precisa em uma única plataforma
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnologia integrada para simplificar toda sua operação logística rural.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Client Types Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Soluções para cada tipo de cliente
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Seja qual for o seu negócio, temos a infraestrutura ideal para você.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {clientTypes.map((type) => (
              <div 
                key={type.title}
                className="flex items-start gap-4 p-6 bg-card rounded-xl border border-border"
              >
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{type.title}</h3>
                  <p className="text-muted-foreground">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
            Pronto para transformar sua logística?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Junte-se a milhares de clientes que já otimizaram suas operações com a Luft AgroHub.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Criar conta gratuita
              </Button>
            </Link>
            <Link to="/site/contato">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Falar com consultor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Franchise CTA */}
      <section className="py-16 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-muted/50 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Quer fazer parte da nossa rede?</h3>
                <p className="text-muted-foreground">Transforme seu depósito em um hub logístico certificado.</p>
              </div>
            </div>
            <Link to="/site/seja-franqueado">
              <Button variant="outline" className="whitespace-nowrap">
                Seja um Franqueado
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
