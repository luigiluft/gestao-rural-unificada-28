import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Warehouse, 
  Truck, 
  BarChart3, 
  Users, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Download,
  Phone,
  Mail,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Package,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  Star,
  Quote
} from "lucide-react";
import logoFull from "@/assets/agrohub-logo-full.svg";

const SejaFranqueado = () => {
  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    cnpj: "",
    responsavel: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    areaDeposito: "",
    mensagem: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoFull} alt="Luft AgroHub" className="h-10" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="#como-funciona">Como Funciona</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#requisitos">Requisitos</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#ganhos">Ganhos</a>
            </Button>
            <Button asChild>
              <a href="#aplicar">Quero ser Franqueado</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
              🌾 Maior rede de armazenagem rural digital do Brasil
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Faça parte da maior rede de{" "}
              <span className="text-primary">armazenagem rural digital</span> do Brasil
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transforme seu depósito em um hub logístico certificado pelo ecossistema Luft AgroHub.
              Ganhe recorrência, clientes garantidos e tecnologia de ponta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href="#aplicar">
                  Quero ser Franqueado
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Download className="mr-2 h-5 w-5" />
                Baixar Apresentação
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona o modelo de franquia
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Um sistema completo para você operar com eficiência e escala
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Operação Logística Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Recebimento, armazenagem, separação e expedição integrados ao WMS e TMS da plataforma.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Tecnologia Centralizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ERP + WMS + TMS + Fiscal já incluídos. Você opera tudo pela plataforma — sem custo extra de software.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Captação de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Você recebe clientes já integrados ao ecossistema. Sua unidade se conecta automaticamente ao fluxo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Receita Recorrente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Armazenagem → recorrência mensal. Movimentações → receita por serviço. Royalties calculados automaticamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section id="requisitos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que você precisa para ser franqueado?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Requisitos objetivos para participar da rede
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: MapPin, text: "Um depósito entre 300 m² e 5.000 m²" },
              { icon: Truck, text: "Acesso fácil para caminhões" },
              { icon: Warehouse, text: "Estrutura mínima (pisos, área seca, energia, internet)" },
              { icon: Building2, text: "Empresa ativa (CNPJ)" },
              { icon: FileText, text: "Inscrição Estadual" },
              { icon: Users, text: "2 a 8 operadores (dependendo do porte)" },
              { icon: ClipboardCheck, text: "Equipe para operações WMS" },
              { icon: Truck, text: "Frota própria (opcional — parceiras disponíveis)" },
            ].map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estrutura de Ganhos */}
      <section id="ganhos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Estrutura de Ganhos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Múltiplas fontes de receita para seu negócio
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Fontes de Receita</CardTitle>
                <CardDescription>O que você pode cobrar dos clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Armazenagem mensal", desc: "m², m³ ou pallet" },
                  { label: "Movimentações", desc: "recebimento, separação, expedição" },
                  { label: "Serviços extras", desc: "balanço, etiquetagem, hora-máquina" },
                  { label: "Transporte", desc: "margem sobre frete" },
                  { label: "Faturamento da filial", desc: "clientes com filial na unidade" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground ml-2">({item.desc})</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Exemplo de Resultado Mensal</CardTitle>
                <CardDescription className="text-primary-foreground/80">Simulação para uma unidade média</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Armazenagem", value: "R$ 32.000" },
                  { label: "Movimentações", value: "R$ 18.000" },
                  { label: "Transporte", value: "R$ 12.000" },
                  { label: "Serviços adicionais", value: "R$ 4.500" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-primary-foreground/90">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-primary-foreground/20 pt-4 mt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>R$ 66.500 / mês</span>
                  </div>
                </div>
                <p className="text-sm text-primary-foreground/70 mt-4">
                  * Simulação ilustrativa. Resultados reais variam conforme região e operação.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que ser um franqueado Luft AgroHub?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diferenciais exclusivos da nossa rede
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              "Sistema completo: ERP + WMS + TMS + Fiscal",
              "Estocagem consolidada com clientes da matriz",
              "Leads qualificados pela plataforma",
              "Operação padronizada via SOPs",
              "Suporte operacional da matriz",
              "Treinamentos, certificações e manuais",
              "Dashboard de performance",
              "Publicidade nacional da marca",
              "Sem necessidade de investir em tecnologia",
              "Módulo fiscal integrado (NF-e, Remessas, CT-e)",
              "Gestão financeira automatizada",
              "Relatórios e métricas em tempo real",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa de Expansão */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Onde estamos?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa rede está em expansão por todo o Brasil
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-6 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">Unidades ativas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-muted-foreground">Em implantação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-muted-foreground">Áreas prioritárias</span>
                  </div>
                </div>
                <p className="text-center text-muted-foreground">
                  Regiões com alta demanda para novos franqueados: <strong>MT, GO, MS, TO, BA, MG, PR, RS</strong>
                </p>
                <Button asChild>
                  <a href="#aplicar">
                    Quero abrir uma unidade na minha região
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Processo de Seleção */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona o processo de seleção
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Do cadastro à operação em 6 etapas
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { step: 1, title: "Inscrição", desc: "Cadastro na plataforma com dados da empresa", icon: FileText },
                { step: 2, title: "Avaliação", desc: "Upload de fotos e documentos do depósito", icon: ClipboardCheck },
                { step: 3, title: "Reunião", desc: "Alinhamento operacional com nossa equipe", icon: Users },
                { step: 4, title: "Contrato", desc: "Assinatura do contrato de franquia", icon: Handshake },
                { step: 5, title: "Treinamento", desc: "Capacitação obrigatória na plataforma", icon: GraduationCap },
                { step: 6, title: "Abertura", desc: "Integração ao sistema e início das operações", icon: Zap },
              ].map((item) => (
                <Card key={item.step} className="relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{item.step}</span>
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
                      <item.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que dizem nossos franqueados
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Carlos Silva",
                location: "Londrina, PR",
                text: "Reduzi meus custos operacionais em 40% com a automação do sistema. A integração com clientes da matriz foi fundamental.",
              },
              {
                name: "Maria Santos",
                location: "Uberlândia, MG",
                text: "O suporte da matriz é excepcional. Em 3 meses já estava com o depósito em plena operação e ocupação acima de 80%.",
              },
              {
                name: "João Oliveira",
                location: "Luís Eduardo Magalhães, BA",
                text: "A tecnologia fez toda diferença. Antes tinha dificuldade em controlar estoque, hoje tudo é automatizado e rastreável.",
              },
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "Quanto custa para ser franqueado?",
                  answer: "A franquia não cobra taxa inicial de adesão. O modelo é baseado em royalties sobre as operações realizadas, calculados automaticamente pela plataforma.",
                },
                {
                  question: "Preciso ter caminhão próprio?",
                  answer: "Não é obrigatório. Você pode operar utilizando transportadoras parceiras já cadastradas na plataforma, ou integrar sua própria frota se preferir.",
                },
                {
                  question: "Posso ter clientes próprios?",
                  answer: "Sim! Seus clientes próprios entram na sua unidade normalmente via ERP, e você recebe por toda a operação realizada para eles.",
                },
                {
                  question: "O que eu vou aprender no treinamento?",
                  answer: "O treinamento cobre: operação do WMS (gestão de estoque), TMS (transporte), módulo Fiscal, procedimentos operacionais (SOPs) e boas práticas da rede Luft.",
                },
                {
                  question: "Qual o tamanho mínimo do depósito?",
                  answer: "Aceitamos depósitos a partir de 300 m², mas o ideal para operação eficiente é entre 500 m² e 5.000 m².",
                },
                {
                  question: "Em quanto tempo começo a operar?",
                  answer: "Após aprovação do cadastro, o processo completo (contrato, treinamento e integração) leva em média 30 a 45 dias até o início das operações.",
                },
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-muted/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Formulário de Aplicação */}
      <section id="aplicar" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Quero ser Franqueado Luft
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Preencha o formulário abaixo e nossa equipe entrará em contato
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                    <Input
                      id="nomeEmpresa"
                      name="nomeEmpresa"
                      value={formData.nomeEmpresa}
                      onChange={handleInputChange}
                      placeholder="Razão social"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Nome do Responsável *</Label>
                    <Input
                      id="responsavel"
                      name="responsavel"
                      value={formData.responsavel}
                      onChange={handleInputChange}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      placeholder="Cidade do depósito"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      placeholder="UF"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaDeposito">Área do Depósito (m²) *</Label>
                  <Input
                    id="areaDeposito"
                    name="areaDeposito"
                    value={formData.areaDeposito}
                    onChange={handleInputChange}
                    placeholder="Ex: 1500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem (opcional)</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    placeholder="Conte-nos mais sobre seu depósito e sua operação atual..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Enviar Aplicação
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Ao enviar, você concorda com nossa política de privacidade.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={logoFull} alt="Luft AgroHub" className="h-8" />
            <div className="flex items-center gap-6 text-muted-foreground">
              <a href="mailto:contato@luftagrohub.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                contato@luftagrohub.com
              </a>
              <a href="tel:+5500000000000" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                (00) 0000-0000
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Luft AgroHub. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SejaFranqueado;
