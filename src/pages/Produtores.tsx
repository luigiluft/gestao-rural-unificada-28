import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MailPlus, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProdutorRow {
  user_id: string;
  nome: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
}

interface FranqueadoOption {
  user_id: string;
  nome: string | null;
}

type PermissionCode = 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage';

const PERMISSIONS: Array<{ code: PermissionCode; label: string }> = [
  { code: 'estoque.view', label: 'Ver estoque' },
  { code: 'estoque.manage', label: 'Gerenciar estoque' },
  { code: 'entradas.manage', label: 'Gerenciar entradas' },
  { code: 'saidas.manage', label: 'Gerenciar saídas' },
];

export default function Produtores() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedFranqueado, setSelectedFranqueado] = useState<string>("");
  const [permissions, setPermissions] = useState<Record<PermissionCode, boolean>>({
    'estoque.view': true,
    'estoque.manage': false,
    'entradas.manage': false,
    'saidas.manage': false,
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    document.title = "Produtores | AgroStock";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Gerencie produtores rurais e suas associações com franqueados no AgroStock';
      document.head.appendChild(m);
    }
  }, []);

  // Fetch franqueados for the dropdown
  const { data: franqueados } = useQuery({
    queryKey: ["franqueados-for-invite"],
    queryFn: async () => {
      // Get users with franqueado role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "franqueado");
      
      if (roleError) throw roleError;
      
      if (!roleData || roleData.length === 0) return [];
      
      const userIds = roleData.map(r => r.user_id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);
      
      if (error) throw error;
      return (data ?? []) as FranqueadoOption[];
    },
  });

  // Fetch produtores with profiles
  const { data: produtores, isLoading } = useQuery({
    queryKey: ["produtores-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtores")
        .select(`
          user_id,
          ativo,
          created_at,
          profiles!inner(nome, email)
        `);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        user_id: p.user_id,
        nome: p.profiles?.nome || null,
        email: p.profiles?.email || null,
        ativo: p.ativo,
        created_at: p.created_at,
      })) as ProdutorRow[];
    },
  });

  const sendInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Informe um email", description: "Digite um email válido para enviar o convite.", variant: "destructive" });
      return;
    }
    if (!selectedFranqueado) {
      toast({ title: "Selecione um franqueado", description: "É obrigatório associar o produtor a um franqueado.", variant: "destructive" });
      return;
    }
    if (!user) return;

    try {
      setSendingInvite(true);

      // Save pending invite with permissions
      const selectedPermissions = (Object.entries(permissions) as [PermissionCode, boolean][])
        .filter(([, enabled]) => enabled)
        .map(([code]) => code);

      const { error: inviteError } = await supabase.from("pending_invites").insert({
        email: inviteEmail,
        inviter_user_id: user.id,
        parent_user_id: selectedFranqueado,
        role: "produtor",
        permissions: selectedPermissions,
      });

      if (inviteError) throw inviteError;

      // Send OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;

      toast({ title: "Convite enviado", description: "Enviamos um link de acesso para o email informado. O produtor será automaticamente associado ao franqueado selecionado." });
      setInviteOpen(false);
      setInviteEmail("");
      setSelectedFranqueado("");
      setPermissions({
        'estoque.view': true,
        'estoque.manage': false,
        'entradas.manage': false,
        'saidas.manage': false,
      });
    } catch (err: any) {
      toast({ title: "Erro ao enviar convite", description: err.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtores</h1>
            <p className="text-muted-foreground">Gerencie produtores rurais e suas associações com franqueados.</p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <MailPlus className="mr-2" />
                Convidar produtor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Convidar produtor rural</DialogTitle>
                <DialogDescription>
                  Convide um produtor e associe-o a um franqueado responsável.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="invite-email">Email do produtor</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="franqueado-select">Franqueado responsável *</Label>
                  <Select value={selectedFranqueado} onValueChange={setSelectedFranqueado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um franqueado" />
                    </SelectTrigger>
                    <SelectContent>
                      {franqueados?.map((f) => (
                        <SelectItem key={f.user_id} value={f.user_id}>
                          {f.nome || "Usuário sem nome"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label>Permissões</Label>
                  {PERMISSIONS.map((perm) => (
                    <div key={perm.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.code}
                        checked={permissions[perm.code]}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, [perm.code]: !!checked }))
                        }
                      />
                      <Label htmlFor={perm.code} className="text-sm font-normal">
                        {perm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendInvite} disabled={sendingInvite || !inviteEmail || !selectedFranqueado}>
                  {sendingInvite ? "Enviando..." : "Enviar convite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        {isLoading ? (
          <div className="text-muted-foreground">Carregando produtores...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtores?.map((p) => (
                <TableRow key={p.user_id}>
                  <TableCell className="font-medium">{p.nome ?? "—"}</TableCell>
                  <TableCell>{p.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? "default" : "secondary"}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      <Settings2 className="mr-1 h-4 w-4" /> Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {produtores?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum produtor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}