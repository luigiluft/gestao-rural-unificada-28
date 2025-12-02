import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Warehouse,
  Laptop,
  Users,
  DollarSign,
  MapPin,
  CheckCircle2,
  ArrowRight,
  FileText,
  Building2,
  Truck,
  BarChart3,
  Shield,
  Headphones,
  Send
} from "lucide-react";

export default function SejaFranqueadoPublic() {
  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    cnpj: "",
    nomeContato: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    areaDeposito: "",
    descricao: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Candidatura enviada com sucesso! Entraremos em contato em breve.");
    setFormData({
      nomeEmpresa: "",
      cnpj: "",
      nomeContato: "",
      email: "",
      telefone: "",
      cidade: "",
      estado: "",
      areaDeposito: "",
      descricao: ""
    });
    setIsSubmitting(false);
  };

  const howItWorks = [
    {
      icon: Warehouse,
      title: "Operação Logística Completa",
      description: "Recebimento, armazenagem, separação e expedição integrados ao WMS e TMS da plataforma."
    },
    {
      icon: Laptop,
      title: "Tecnologia Centralizada",
      description: "ERP + WMS + TMS + Fiscal já incluídos. Você opera tudo pela plataforma — sem custo extra de software."
    },
    {
      icon: Users,
      title: "Captação de Clientes pela Matriz",
      description: "Você recebe clientes já integrados ao ecossistema. Sua unidade se conecta automaticamente."
    },
    {
      icon: DollarSign,
      title: "Receita Recorrente",
      description: "Armazenagem → recorrência mensal. Movimentações → receita por serviço. Royalties calculados automaticamente."
    }
  ];

  const requirements = [
    { icon: MapPin, text: "Um depósito entre 300 m² e 5.000 m²" },
    { icon: Truck, text: "Acesso fácil para caminhões" },
    { icon: Building2, text: "Estrutura mínima (pisos, área seca, energia, internet)" },
    { icon: FileText, text: "Empresa ativa (CNPJ)" },
    { icon: Shield, text: "Inscrição Estadual" },
    { icon: Users, text: "2 a 8 operadores (dependendo do porte)" }
  ];

  const differentials = [
    "Sistema completo: ERP + WMS + TMS + Fiscal",
    "Estocagem consolidada com clientes da matriz",
    "Leads qualificados pela plataforma",
    "Operação padronizada via SOPs",
    "Suporte operacional da matriz",
    "Treinamentos, certificações e manuais",
    "Dashboard de performance",
    "Publicidade nacional da marca",
    "Módulo fiscal integrado (NF-e, Remessas, CT-e)"
  ];

  const selectionProcess = [
    "Inscrição na plataforma",
    "Avaliação da estrutura do depósito",
    "Reunião de alinhamento operacional",
    "Assinatura do contrato",
    "Treinamento obrigatório",
    "Integração ao sistema",
    "Abertura da unidade"
  ];

  const faqItems = [
    {
      question: "Quanto custa para ser franqueado?",
      answer: "A franquia não cobra taxa inicial, apenas royalties sobre operações realizadas na plataforma."
    },
    {
      question: "Preciso ter caminhão?",
      answer: "Não, você pode operar usando transportadoras parceiras cadastradas na plataforma."
    },
    {
      question: "Posso ter clientes próprios?",
      answer: "Sim, e eles entram na sua unidade normalmente via ERP, com total controle e rastreabilidade."
    },
    {
      question: "O que eu vou aprender no treinamento?",
      answer: "WMS, TMS, Fiscal, Operações Luft e SOPs padronizados para garantir a qualidade."
    },
    {
      question: "Qual o suporte oferecido?",
      answer: "Suporte técnico e operacional contínuo, além de atualizações constantes na plataforma."
    }
  ];

  const testimonials = [
    {
      quote: "O sistema simplificou toda minha operação. Antes eu tinha 3 softwares diferentes, agora só uso a Luft.",
      author: "João Paulo",
      role: "Franqueado - Londrina, PR"
    },
    {
      quote: "Em 6 meses já estava com o depósito 80% ocupado. Os clientes chegam pelo ecossistema.",
      author: "Marina Rodrigues",
      role: "Franqueada - Uberlândia, MG"
    },
    {
      quote: "O suporte da matriz é excelente. Sempre que preciso, tenho resposta rápida.",
      author: "Carlos Mendes",
      role: "Franqueado - Cuiabá, MT"
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Faça parte da maior rede de armazenagem rural digital do Brasil
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transforme seu depósito em um hub logístico certificado pelo ecossistema Luft AgroHub. 
              Ganhe recorrência, clientes garantidos e tecnologia de ponta.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="#aplicar">
                <Button size="lg">
                  Quero ser franqueado
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Como funciona o modelo de franquia
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <Card key={item.title} className="border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              O que você precisa para ser franqueado?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {requirements.map((req) => (
              <div key={req.text} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <req.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground">{req.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Structure */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Estrutura de ganhos
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Diversas fontes de receita para maximizar o retorno do seu depósito.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Armazenagem mensal (m², m³ ou pallet)",
                  "Movimentações (recebimento, separação, expedição)",
                  "Serviços extras (balanço, etiquetagem, hora-máquina)",
                  "Transporte (margem sobre frete)",
                  "Faturamento da filial (para clientes com filial)"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-border">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">Exemplo de resultado mensal</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Armazenagem</span>
                    <span className="font-medium text-foreground">R$ 32.000</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Movimentações</span>
                    <span className="font-medium text-foreground">R$ 18.000</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Transporte</span>
                    <span className="font-medium text-foreground">R$ 12.000</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Serviços adicionais</span>
                    <span className="font-medium text-foreground">R$ 4.500</span>
                  </div>
                  <div className="flex justify-between py-3 bg-primary/10 rounded-lg px-4 -mx-4">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-xl">R$ 66.500</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Por que ser um franqueado Luft AgroHub?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {differentials.map((diff) => (
              <div key={diff} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{diff}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selection Process */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Processo de seleção
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              {selectionProcess.map((step, index) => (
                <div key={step} className="relative flex items-center gap-6 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1 p-4 bg-card border border-border rounded-lg">
                    <span className="text-foreground font-medium">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Depoimentos de franqueados
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

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Perguntas frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="aplicar" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Quero ser Franqueado Luft
              </h2>
              <p className="mt-4 text-muted-foreground">
                Preencha o formulário abaixo e nossa equipe entrará em contato.
              </p>
            </div>

            <Card className="border-border">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                      <Input
                        id="nomeEmpresa"
                        name="nomeEmpresa"
                        value={formData.nomeEmpresa}
                        onChange={handleInputChange}
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
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomeContato">Nome do Contato *</Label>
                      <Input
                        id="nomeContato"
                        name="nomeContato"
                        value={formData.nomeContato}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="areaDeposito">Área do Depósito (m²)</Label>
                      <Input
                        id="areaDeposito"
                        name="areaDeposito"
                        value={formData.areaDeposito}
                        onChange={handleInputChange}
                        placeholder="Ex: 1000"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleInputChange}
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
                        required
                        placeholder="Ex: PR"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Conte mais sobre seu depósito</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Descreva sua estrutura atual, experiência no setor, etc."
                    />
                  </div>

                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar candidatura
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
