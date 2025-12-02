import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Clock, 
  Shield, 
  TrendingUp, 
  MapPin, 
  Headphones,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3
} from "lucide-react";

export default function Beneficios() {
  const mainBenefits = [
    {
      icon: DollarSign,
      title: "Redução de Custos",
      description: "Elimine custos com software, estrutura própria e equipe de TI. Pague apenas pelo que usar.",
      stats: "Até 40% de economia"
    },
    {
      icon: Clock,
      title: "Agilidade Operacional",
      description: "Processos automatizados de recebimento a expedição. Menos tempo, mais entregas.",
      stats: "3x mais rápido"
    },
    {
      icon: Shield,
      title: "Segurança e Compliance",
      description: "Rastreabilidade total, documentação fiscal automática e conformidade garantida.",
      stats: "100% compliance"
    },
    {
      icon: TrendingUp,
      title: "Escalabilidade",
      description: "Cresça sem preocupação. A rede de depósitos acompanha o crescimento do seu negócio.",
      stats: "50+ depósitos"
    },
    {
      icon: MapPin,
      title: "Capilaridade Nacional",
      description: "Acesso a depósitos estratégicos em todo o Brasil para distribuição eficiente.",
      stats: "15 estados"
    },
    {
      icon: Headphones,
      title: "Suporte Especializado",
      description: "Equipe dedicada para ajudar em todas as etapas da sua operação.",
      stats: "24/7 disponível"
    }
  ];

  const comparisons = [
    {
      feature: "Investimento em software",
      traditional: "Alto custo inicial + mensalidade",
      luft: "Incluído na plataforma"
    },
    {
      feature: "Infraestrutura de armazém",
      traditional: "Própria ou aluguel fixo",
      luft: "Pague por uso"
    },
    {
      feature: "Equipe de TI",
      traditional: "Necessária",
      luft: "Não necessária"
    },
    {
      feature: "Emissão de notas fiscais",
      traditional: "Manual ou software à parte",
      luft: "Automática e integrada"
    },
    {
      feature: "Rastreamento de entregas",
      traditional: "Depende da transportadora",
      luft: "Integrado na plataforma"
    },
    {
      feature: "Escala de operação",
      traditional: "Limitada à estrutura",
      luft: "Ilimitada via rede"
    }
  ];

  const testimonials = [
    {
      quote: "Reduzi em 35% meus custos logísticos no primeiro ano. A plataforma simplificou tudo.",
      author: "Carlos Mendes",
      role: "Produtor Rural - MT"
    },
    {
      quote: "Consegui expandir minha distribuição para 5 novos estados sem investir em estrutura.",
      author: "Marina Santos",
      role: "Diretora - Revenda de Insumos"
    },
    {
      quote: "A rastreabilidade do sistema nos ajudou a conquistar certificações importantes.",
      author: "Roberto Lima",
      role: "Gerente de Qualidade - Indústria"
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Benefícios para seu negócio
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Descubra como a Luft AgroHub pode transformar sua operação logística, 
              reduzir custos e aumentar a eficiência do seu negócio.
            </p>
          </div>
        </div>
      </section>

      {/* Main Benefits */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainBenefits.map((benefit) => (
              <Card key={benefit.title} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {benefit.stats}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Luft AgroHub vs. Modelo Tradicional
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Veja por que empresas estão migrando para nossa plataforma.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-card rounded-xl border border-border overflow-hidden">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Aspecto</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Modelo Tradicional</th>
                  <th className="text-left p-4 font-semibold text-primary">Luft AgroHub</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr key={row.feature} className={index < comparisons.length - 1 ? "border-b border-border" : ""}>
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-muted-foreground">{row.traditional}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{row.luft}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Retorno sobre investimento comprovado
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Nossos clientes experimentam resultados tangíveis desde o primeiro mês de operação.
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Implementação rápida</h4>
                    <p className="text-muted-foreground">Comece a operar em até 7 dias após o cadastro.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Resultados mensuráveis</h4>
                    <p className="text-muted-foreground">Dashboard com métricas de economia e eficiência.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Payback em 3 meses</h4>
                    <p className="text-muted-foreground">A maioria dos clientes recupera o investimento rapidamente.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-2xl p-8 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-6">Economia média por cliente</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Custos com software</span>
                    <span className="font-medium text-primary">-100%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Estrutura física</span>
                    <span className="font-medium text-primary">-60%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Equipe administrativa</span>
                    <span className="font-medium text-primary">-40%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "40%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Frete e logística</span>
                    <span className="font-medium text-primary">-25%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="border-border">
                <CardContent className="p-6">
                  <p className="text-muted-foreground italic mb-6">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
            Experimente os benefícios na prática
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Crie sua conta gratuita e descubra como a Luft AgroHub pode transformar seu negócio.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
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
    </div>
  );
}
