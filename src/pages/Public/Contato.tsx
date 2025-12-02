import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { useEmpresaMatriz, getEnderecoResumido } from "@/hooks/useEmpresaMatriz";
import { PublicBrazilMap } from "@/components/Public/PublicBrazilMap";
import { useDepositosParaMapa } from "@/hooks/useDepositosParaMapa";

export default function Contato() {
  const { data: empresaData, isLoading: isLoadingEmpresa } = useEmpresaMatriz();
  const { data: depositos } = useDepositosParaMapa();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    assunto: "",
    mensagem: ""
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
    
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      empresa: "",
      assunto: "",
      mensagem: ""
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "E-mail",
      value: empresaData?.email || "contato@luftagrohub.com.br",
      href: `mailto:${empresaData?.email || "contato@luftagrohub.com.br"}`
    },
    {
      icon: Phone,
      label: "Telefone",
      value: empresaData?.telefone || "(43) 99999-9999",
      href: `tel:${(empresaData?.telefone || "").replace(/\D/g, "")}`
    },
    {
      icon: MapPin,
      label: "Endereço",
      value: empresaData ? getEnderecoResumido(empresaData) : "Londrina, PR - Brasil",
      href: null
    },
    {
      icon: Clock,
      label: "Horário",
      value: empresaData?.horario_funcionamento || "Seg - Sex: 8h às 18h",
      href: null
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Entre em contato
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Tem dúvidas ou quer saber mais sobre como a Luft AgroHub pode ajudar seu negócio? 
              Nossa equipe está pronta para atender você.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-foreground mb-6">Informações de contato</h2>
              
              {isLoadingEmpresa ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <div className="space-y-6">
                  {contactInfo.map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{info.label}</div>
                        {info.href ? (
                          <a 
                            href={info.href} 
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <div className="font-medium text-foreground">{info.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ Link */}
              <Card className="mt-8 border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Perguntas frequentes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Confira as respostas para as dúvidas mais comuns sobre nossa plataforma.
                  </p>
                  <a 
                    href="/site/como-funciona#faq" 
                    className="text-primary font-medium text-sm hover:underline"
                  >
                    Ver FAQ →
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Envie sua mensagem</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo *</Label>
                        <Input
                          id="nome"
                          name="nome"
                          value={formData.nome}
                          onChange={handleInputChange}
                          required
                          placeholder="Seu nome"
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
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empresa">Empresa</Label>
                        <Input
                          id="empresa"
                          name="empresa"
                          value={formData.empresa}
                          onChange={handleInputChange}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assunto">Assunto *</Label>
                      <Input
                        id="assunto"
                        name="assunto"
                        value={formData.assunto}
                        onChange={handleInputChange}
                        required
                        placeholder="Assunto da mensagem"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mensagem">Mensagem *</Label>
                      <Textarea
                        id="mensagem"
                        name="mensagem"
                        value={formData.mensagem}
                        onChange={handleInputChange}
                        required
                        placeholder="Descreva como podemos ajudar..."
                        rows={5}
                      />
                    </div>

                    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          Enviar mensagem
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Onde estamos</h2>
            <p className="mt-4 text-muted-foreground">
              Nossa sede fica em {empresaData?.cidade || "Londrina"}, {empresaData?.estado || "PR"}, 
              mas atendemos todo o Brasil através da nossa rede de {depositos?.length || 0} depósitos.
            </p>
          </div>
          
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <PublicBrazilMap />
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {depositos?.filter(d => d.tipo_deposito === "franquia").length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Franquias</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {depositos?.filter(d => d.tipo_deposito === "filial").length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Filiais</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-foreground">
                  {new Set(depositos?.map(d => d.estado)).size || 0}
                </div>
                <div className="text-sm text-muted-foreground">Estados</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-foreground">
                  {depositos?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total de Depósitos</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
