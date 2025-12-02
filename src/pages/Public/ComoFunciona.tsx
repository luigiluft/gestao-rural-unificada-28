import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlus, 
  FileText, 
  Warehouse, 
  Package, 
  Truck, 
  BarChart3,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function ComoFunciona() {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Cadastre-se na plataforma",
      description: "Crie sua conta gratuitamente e configure o perfil da sua empresa com dados fiscais."
    },
    {
      number: "02",
      icon: FileText,
      title: "Escolha um depósito",
      description: "Selecione o depósito mais próximo da sua operação entre nossa rede de franqueados."
    },
    {
      number: "03",
      icon: Warehouse,
      title: "Envie sua mercadoria",
      description: "Agende o recebimento e envie sua carga com nota fiscal para o depósito escolhido."
    },
    {
      number: "04",
      icon: Package,
      title: "Gestão de estoque",
      description: "Acompanhe seu estoque em tempo real, com controle de lote, validade e posição WMS."
    },
    {
      number: "05",
      icon: Truck,
      title: "Solicite entregas",
      description: "Crie ordens de saída e a plataforma cuida da separação, expedição e transporte."
    },
    {
      number: "06",
      icon: BarChart3,
      title: "Receba relatórios",
      description: "Dashboard completo com métricas de movimentação, custos e performance."
    }
  ];

  const modules = [
    {
      title: "WMS - Gestão de Armazém",
      features: [
        "Controle de posições no armazém",
        "Gestão de pallets e lotes",
        "Inventário rotativo",
        "Separação otimizada (picking)",
        "Etiquetagem e código de barras"
      ]
    },
    {
      title: "TMS - Gestão de Transporte",
      features: [
        "Roteirização inteligente",
        "Rastreamento em tempo real",
        "Gestão de frota e motoristas",
        "Comprovante de entrega digital",
        "Integração com transportadoras"
      ]
    },
    {
      title: "ERP - Gestão Financeira",
      features: [
        "Faturamento automático",
        "Controle de receitas e despesas",
        "Gestão de contratos",
        "Relatórios financeiros",
        "Integração bancária"
      ]
    },
    {
      title: "Fiscal - Documentação",
      features: [
        "Emissão de NF-e automática",
        "CT-e para transporte",
        "Remessas para armazenagem",
        "Relatórios SPED",
        "Conformidade tributária"
      ]
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Como funciona a Luft AgroHub
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Uma plataforma completa que simplifica toda a operação logística do seu negócio. 
              Do recebimento à entrega final, tudo integrado e automatizado.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Passo a passo
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comece a usar a plataforma em minutos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => (
              <Card key={step.number} className="border-border relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                    {step.number}
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Módulos da plataforma
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Todas as ferramentas que você precisa, integradas em um único sistema.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {modules.map((module) => (
              <Card key={module.title} className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground text-xl mb-4">{module.title}</h3>
                  <ul className="space-y-3">
                    {module.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Integração total entre módulos
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Todos os módulos trabalham juntos de forma inteligente. Quando você solicita uma saída, 
                o WMS separa, o TMS roteiriza, o Fiscal emite a documentação e o ERP registra a receita. 
                Tudo automático.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Sem retrabalho ou entrada manual de dados",
                  "Rastreabilidade completa de ponta a ponta",
                  "Relatórios consolidados em tempo real",
                  "Alertas inteligentes e automações"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/50 rounded-2xl p-8 border border-border">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Ordem de Saída Criada</div>
                    <div className="text-sm text-muted-foreground">Pedido #12345</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Separação Iniciada</div>
                    <div className="text-sm text-muted-foreground">WMS processando</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">NF-e Emitida</div>
                    <div className="text-sm text-muted-foreground">Fiscal automático</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Em Trânsito</div>
                    <div className="text-sm text-muted-foreground">Rastreamento ativo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Crie sua conta gratuita e comece a usar a plataforma em minutos.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Criar conta gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
