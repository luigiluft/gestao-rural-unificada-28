import { useState } from "react";
import {
  Plus,
  Search,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Globe,
  User,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAtendimentos,
  useCreateAtendimento,
  useUpdateAtendimento,
  Atendimento,
} from "@/hooks/useAtendimentos";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AtendimentoPage() {
  const { data: atendimentos = [], isLoading } = useAtendimentos();
  const createAtendimento = useCreateAtendimento();
  const updateAtendimento = useUpdateAtendimento();
  const { isAdmin } = useUserRole();

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterOrigem, setFilterOrigem] = useState<string>("todos");

  const [newTicket, setNewTicket] = useState({
    titulo: "",
    descricao: "",
    categoria: "",
    prioridade: "media",
  });

  const [resposta, setResposta] = useState("");

  const handleCreateTicket = async () => {
    if (!newTicket.titulo || !newTicket.descricao) return;
    await createAtendimento.mutateAsync(newTicket);
    setIsNewTicketOpen(false);
    setNewTicket({ titulo: "", descricao: "", categoria: "", prioridade: "media" });
  };

  const handleResponder = async () => {
    if (!selectedAtendimento || !resposta) return;
    await updateAtendimento.mutateAsync({
      id: selectedAtendimento.id,
      resposta,
      status: "respondido",
    });
    setResposta("");
    setSelectedAtendimento(null);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateAtendimento.mutateAsync({ id, status });
  };

  const filteredAtendimentos = atendimentos.filter((a) => {
    const matchesSearch =
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nome_contato?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || a.status === filterStatus;
    const matchesOrigem = filterOrigem === "todos" || a.origem === filterOrigem;
    return matchesSearch && matchesStatus && matchesOrigem;
  });

  const stats = {
    abertos: atendimentos.filter((a) => a.status === "aberto").length,
    emAndamento: atendimentos.filter((a) => a.status === "em_andamento").length,
    respondidos: atendimentos.filter((a) => a.status === "respondido").length,
    site: atendimentos.filter((a) => a.origem === "site").length,
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "aberto":
        return <Badge variant="destructive">Aberto</Badge>;
      case "em_andamento":
        return <Badge variant="secondary">Em Andamento</Badge>;
      case "respondido":
        return <Badge className="bg-green-500">Respondido</Badge>;
      case "fechado":
        return <Badge variant="outline">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrigemBadge = (origem: string) => {
    if (origem === "site") {
      return (
        <Badge variant="outline" className="gap-1">
          <Globe className="h-3 w-3" />
          Site
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <User className="h-3 w-3" />
        Interno
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atendimento</h1>
          <p className="text-muted-foreground">Gerencie solicitações e chamados de suporte</p>
        </div>

        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>
                Descreva sua solicitação ou problema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newTicket.categoria}
                    onValueChange={(v) => setNewTicket({ ...newTicket, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Problema Técnico</SelectItem>
                      <SelectItem value="duvida">Dúvida</SelectItem>
                      <SelectItem value="melhoria">Sugestão</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newTicket.prioridade}
                    onValueChange={(v) => setNewTicket({ ...newTicket, prioridade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={newTicket.titulo}
                  onChange={(e) => setNewTicket({ ...newTicket, titulo: e.target.value })}
                  placeholder="Descreva brevemente o problema"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={newTicket.descricao}
                  onChange={(e) => setNewTicket({ ...newTicket, descricao: e.target.value })}
                  placeholder="Detalhe sua solicitação..."
                  rows={5}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.titulo || !newTicket.descricao || createAtendimento.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abertos</p>
                <p className="text-2xl font-bold text-destructive">{stats.abertos}</p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.emAndamento}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Respondidos</p>
                <p className="text-2xl font-bold text-green-500">{stats.respondidos}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Via Site</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.site}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="respondido">Respondido</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Origens</SelectItem>
                  <SelectItem value="interno">Interno</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {filteredAtendimentos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum atendimento encontrado</h3>
              <p className="text-muted-foreground">
                Crie um novo chamado para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAtendimentos.map((atendimento) => (
            <Card
              key={atendimento.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedAtendimento(atendimento)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-medium truncate">{atendimento.titulo}</h3>
                      {getStatusBadge(atendimento.status)}
                      {getOrigemBadge(atendimento.origem)}
                      {atendimento.prioridade === "alta" && (
                        <Badge variant="destructive">Alta Prioridade</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {atendimento.descricao}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {atendimento.origem === "site" && atendimento.nome_contato && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {atendimento.nome_contato}
                        </span>
                      )}
                      {atendimento.email_contato && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {atendimento.email_contato}
                        </span>
                      )}
                      <span>
                        {format(new Date(atendimento.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAtendimento} onOpenChange={() => setSelectedAtendimento(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedAtendimento && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedAtendimento.titulo}
                  {getStatusBadge(selectedAtendimento.status)}
                  {getOrigemBadge(selectedAtendimento.origem)}
                </DialogTitle>
                <DialogDescription>
                  Criado em{" "}
                  {format(new Date(selectedAtendimento.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact info for site submissions */}
                {selectedAtendimento.origem === "site" && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Contato do Site
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      {selectedAtendimento.nome_contato && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedAtendimento.nome_contato}</span>
                        </div>
                      )}
                      {selectedAtendimento.email_contato && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${selectedAtendimento.email_contato}`}
                            className="text-primary hover:underline"
                          >
                            {selectedAtendimento.email_contato}
                          </a>
                        </div>
                      )}
                      {selectedAtendimento.telefone_contato && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedAtendimento.telefone_contato}</span>
                        </div>
                      )}
                      {selectedAtendimento.empresa_contato && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedAtendimento.empresa_contato}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {selectedAtendimento.descricao}
                  </p>
                </div>

                {/* Response */}
                {selectedAtendimento.resposta && (
                  <div>
                    <Label className="text-sm font-medium">Resposta</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      {selectedAtendimento.resposta}
                    </p>
                    {selectedAtendimento.data_resposta && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Respondido em{" "}
                        {format(new Date(selectedAtendimento.data_resposta), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Admin actions */}
                {(isAdmin || selectedAtendimento.origem === "interno") && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex gap-2">
                      <Select
                        value={selectedAtendimento.status || "aberto"}
                        onValueChange={(v) => handleUpdateStatus(selectedAtendimento.id, v)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="respondido">Respondido</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!selectedAtendimento.resposta && (
                      <div className="space-y-2">
                        <Label>Responder</Label>
                        <Textarea
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={4}
                        />
                        <Button
                          onClick={handleResponder}
                          disabled={!resposta || updateAtendimento.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Resposta
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
