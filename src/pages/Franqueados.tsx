import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MailPlus, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FranqueadoData {
  id: string;
  nome: string;
  email: string;
  created_at: string;
  ativo: boolean;
}

export default function Franqueados() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [franqueados, setFranqueados] = useState<FranqueadoData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFranqueados = async () => {
    try {
      setLoading(true);
      
      // Get users with franqueado role by joining with profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          nome,
          email,
          created_at,
          user_roles!inner (
            role
          )
        `)
        .eq('user_roles.role', 'franqueado');

      if (profilesError) throw profilesError;

      const franqueadosData = profiles?.map(profile => ({
        id: profile.user_id,
        nome: profile.nome || 'Nome não informado',
        email: profile.email || 'Email não informado',
        created_at: profile.created_at || '',
        ativo: true // Franqueados são sempre ativos
      })) || [];

      setFranqueados(franqueadosData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar franqueados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Informe um email",
        description: "Digite um email válido para enviar o convite.",
        variant: "destructive",
      });
      return;
    }
    if (!user) return;

    try {
      setSendingInvite(true);

      // Call edge function to send invite
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: inviteEmail,
          inviterUserId: user.id,
          parentUserId: user.id,
          role: "franqueado",
          permissions: ['estoque.view', 'estoque.manage', 'entradas.manage', 'saidas.manage']
        }
      });
      if (error) throw error;
      toast({
        title: "Convite enviado",
        description: "Enviamos um link de confirmação por email. O franqueado precisa clicar no link para completar o cadastro.",
      });
      setInviteOpen(false);
      setInviteEmail("");
      // Reload the list to show new franchisees
      loadFranqueados();
    } catch (err: any) {
      toast({
        title: "Erro ao enviar convite",
        description: err.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  useEffect(() => {
    document.title = "Franqueados | AgroStock";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content =
      "Gerencie franqueados: convites por email, acessos e permissões.";
    if (metaDesc) {
      metaDesc.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
    const canonicalUrl = `${window.location.origin}/franqueados`;
    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute("href", canonicalUrl);
    } else {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      l.setAttribute("href", canonicalUrl);
      document.head.appendChild(l);
    }
    
    loadFranqueados();
  }, []);

  return (
    <main>
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Franqueados</h1>
            <p className="text-muted-foreground">
              Gerencie os franqueados e seus acessos.
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <MailPlus className="mr-2" />
                Convidar franqueado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar franqueado</DialogTitle>
                <DialogDescription>
                  Envie um link de acesso por email para o franqueado se
                  cadastrar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendInvite} disabled={sendingInvite || !inviteEmail}>
                  {sendingInvite ? "Enviando..." : "Enviar convite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Franqueados
            </CardTitle>
            <CardDescription>
              Franqueados cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando franqueados...</p>
              </div>
            ) : franqueados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum franqueado cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {franqueados.map((franqueado) => (
                  <div
                    key={franqueado.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{franqueado.nome}</h3>
                      <p className="text-sm text-muted-foreground">{franqueado.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em: {new Date(franqueado.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={franqueado.ativo ? "default" : "secondary"}>
                        {franqueado.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
