import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Users, Award, TrendingUp } from "lucide-react";

export default function Sobre() {
  const values = [
    {
      icon: Target,
      title: "Inovação",
      description: "Buscamos constantemente novas tecnologias para transformar a logística rural."
    },
    {
      icon: Heart,
      title: "Compromisso",
      description: "Dedicação total à excelência operacional e satisfação dos nossos clientes."
    },
    {
      icon: Users,
      title: "Parceria",
      description: "Construímos relacionamentos de longo prazo baseados em confiança e transparência."
    },
    {
      icon: Award,
      title: "Qualidade",
      description: "Padrões elevados em todos os processos, da armazenagem à entrega final."
    }
  ];

  const timeline = [
    { year: "2020", event: "Fundação da Luft AgroHub em Londrina, PR" },
    { year: "2021", event: "Lançamento da plataforma WMS integrada" },
    { year: "2022", event: "Expansão para 10 estados brasileiros" },
    { year: "2023", event: "Implementação do módulo TMS e fiscal completo" },
    { year: "2024", event: "Mais de 50 depósitos na rede e 1000+ clientes ativos" }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Sobre a Luft AgroHub
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Nascemos da necessidade de modernizar a logística rural brasileira. 
              Combinamos tecnologia de ponta com conhecimento profundo do agronegócio 
              para criar a maior rede de armazenagem inteligente do país.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Nossa Missão</h2>
                <p className="text-muted-foreground">
                  Democratizar o acesso à logística de qualidade no agronegócio brasileiro, 
                  conectando produtores, indústrias e revendas a uma rede eficiente e tecnológica 
                  de armazenagem e distribuição.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Nossa Visão</h2>
                <p className="text-muted-foreground">
                  Ser a principal plataforma de logística rural do Brasil até 2030, 
                  presente em todos os estados e reconhecida pela excelência operacional, 
                  inovação tecnológica e impacto positivo no agronegócio.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Nossos Valores
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Os princípios que guiam todas as nossas ações.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="border-border text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Nossa Trajetória
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Uma história de crescimento e inovação constante.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />
              
              {timeline.map((item, index) => (
                <div 
                  key={item.year}
                  className={`relative flex items-center gap-6 mb-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`flex-1 hidden md:block ${index % 2 === 0 ? "text-right" : "text-left"}`}>
                    <div className="inline-block p-4 bg-card border border-border rounded-xl">
                      <div className="font-bold text-primary text-lg">{item.year}</div>
                      <div className="text-muted-foreground">{item.event}</div>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                  </div>
                  
                  <div className="flex-1 md:hidden">
                    <div className="p-4 bg-card border border-border rounded-xl">
                      <div className="font-bold text-primary text-lg">{item.year}</div>
                      <div className="text-muted-foreground">{item.event}</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
            Faça parte dessa história
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Junte-se a milhares de clientes que confiam na Luft AgroHub para suas operações logísticas.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
