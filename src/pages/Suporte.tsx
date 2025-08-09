import { useState } from "react"
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Phone,
  Mail,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const chamados = [
  {
    id: "SUP001",
    titulo: "Erro ao importar XML de entrada",
    categoria: "Técnico",
    status: "Aberto",
    prioridade: "Alta",
    dataAbertura: "2024-08-09",
    ultimaAtualizacao: "2024-08-09",
    responsavel: "Suporte Técnico"
  },
  {
    id: "SUP002",
    titulo: "Dúvida sobre relatório de estoque",
    categoria: "Dúvida",
    status: "Em Andamento",
    prioridade: "Média",
    dataAbertura: "2024-08-08",
    ultimaAtualizacao: "2024-08-09",
    responsavel: "Ana Paula"
  },
  {
    id: "SUP003",
    titulo: "Solicitação de nova funcionalidade",
    categoria: "Melhoria",
    status: "Resolvido",
    prioridade: "Baixa",
    dataAbertura: "2024-08-05",
    ultimaAtualizacao: "2024-08-07",
    responsavel: "Equipe de Desenvolvimento"
  }
]

const faqItems = [
  {
    pergunta: "Como faço para importar um XML de entrada?",
    resposta: "Acesse a página de Entradas, clique em 'Importar XML' e selecione o arquivo. O sistema processará automaticamente as informações."
  },
  {
    pergunta: "Por que meu produto aparece com estoque baixo?",
    resposta: "O sistema alerta quando a quantidade está abaixo do limite mínimo configurado. Verifique as configurações do produto ou faça uma nova entrada."
  },
  {
    pergunta: "Como gerar um relatório personalizado?",
    resposta: "Na página de Relatórios, selecione o tipo desejado, defina o período e clique em 'Gerar'. Você pode exportar os dados em Excel."
  },
  {
    pergunta: "Posso rastrear pedidos de diferentes transportadoras?",
    resposta: "Sim, o sistema suporta múltiplas transportadoras. Cadastre o código de rastreamento na saída do produto."
  }
]

export default function Suporte() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "destructive"
      case "Em Andamento":
        return "secondary"
      case "Resolvido":
        return "default"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "Alta":
        return "destructive"
      case "Média":
        return "secondary"
      case "Baixa":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suporte</h1>
          <p className="text-muted-foreground">
            Central de ajuda e atendimento ao cliente
          </p>
        </div>
        
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>
                Descreva sua solicitação ou problema para nossa equipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Problema Técnico</SelectItem>
                      <SelectItem value="duvida">Dúvida</SelectItem>
                      <SelectItem value="melhoria">Sugestão de Melhoria</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Chamado</Label>
                <Input id="titulo" placeholder="Descreva brevemente o problema..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição Detalhada</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Forneça o máximo de detalhes possível sobre sua solicitação..."
                  rows={5}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsNewTicketOpen(false)}>
                <Send className="w-4 h-4 mr-2" />
                Enviar Chamado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chamados Abertos</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-warning">1</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolvidos</p>
                <p className="text-2xl font-bold text-success">28</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">2.5h</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chamados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chamados">Meus Chamados</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contato">Contato</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chamados" className="space-y-4">
          {/* Search */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar chamados por ID, título ou categoria..."
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Chamados List */}
          <div className="space-y-4">
            {chamados.map((chamado) => (
              <Card key={chamado.id} className="shadow-card hover:shadow-elevated transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{chamado.titulo}</h3>
                        <Badge variant={getStatusColor(chamado.status) as any}>
                          {chamado.status}
                        </Badge>
                        <Badge variant={getPriorityColor(chamado.prioridade) as any}>
                          {chamado.prioridade}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">ID:</span> {chamado.id}
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span> {chamado.categoria}
                        </div>
                        <div>
                          <span className="font-medium">Abertura:</span> {new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Responsável:</span> {chamado.responsavel}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="faq" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Perguntas Frequentes
              </CardTitle>
              <CardDescription>
                Encontre respostas para as dúvidas mais comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-b-0">
                    <h4 className="font-medium mb-2 text-foreground">{item.pergunta}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.resposta}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contato" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Canais de Atendimento</CardTitle>
                <CardDescription>
                  Entre em contato através dos nossos canais oficiais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">(11) 3000-0000</p>
                    <p className="text-xs text-muted-foreground">Seg-Sex: 8h às 18h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-sm text-muted-foreground">suporte@agrostock.com</p>
                    <p className="text-xs text-muted-foreground">Resposta em até 24h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Chat Online</p>
                    <p className="text-sm text-muted-foreground">Disponível no sistema</p>
                    <p className="text-xs text-muted-foreground">Seg-Sex: 8h às 18h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Documentação</CardTitle>
                <CardDescription>
                  Acesse manuais e guias de uso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Manual do Usuário
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Guia de Primeiros Passos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Tutoriais em Vídeo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  API Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}