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
import { MailPlus, Settings2, Link as LinkIcon, Unlink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileRow {
  user_id: string;
  nome: string | null;
  email: string | null;
}

export default function Usuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const sendInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Informe um email", description: "Digite um email válido para enviar o convite.", variant: "destructive" });
      return;
    }
    if (!user) return;

    try {
      setSendingInvite(true);

      // Save pending invite - subconta with hierarchy and default permissions
      const { error: inviteError } = await supabase.from("pending_invites").insert({
        email: inviteEmail,
        inviter_user_id: user.id,
        parent_user_id: user.id, // hierarchy: admin becomes parent
        permissions: ['estoque.view'], // default permission for subconta
      });

      if (inviteError) throw inviteError;

      const { error } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      toast({ title: "Convite enviado", description: "Enviamos um link de acesso para o email informado. A subconta será automaticamente vinculada." });
      setInviteOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar convite", description: err.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };
  useEffect(() => {
    document.title = "Usuários | AgroStock";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Gerencie usuários e conceda acesso admin no AgroStock';
      document.head.appendChild(m);
    }
  }, []);

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: roleMap, isLoading: loadingRoles } = useQuery({
    queryKey: ["computed-roles", (profiles ?? []).map((p) => p.user_id)],
    enabled: !!profiles,
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!profiles) return map;
      // Check roles via security-definer RPC to avoid RLS recursion
      const results = await Promise.all(
        profiles.map(async (p) => {
          const [adminRes, franqRes] = await Promise.all([
            supabase.rpc('has_role', { _user_id: p.user_id, _role: 'admin' }),
            supabase.rpc('has_role', { _user_id: p.user_id, _role: 'franqueado' }),
          ])
          const isAdmin = adminRes.data === true
          const isFranqueado = franqRes.data === true
          const label = isAdmin ? 'Admin' : isFranqueado ? 'Franqueado' : 'Produtor'
          return [p.user_id, label] as const
        })
      )
      results.forEach(([id, label]) => map.set(id, label))
      return map as Map<string, string>
    },
  })

  const makeAdmin = async (userId: string) => {
    const alreadyAdmin = roleMap?.get(userId) === "Admin";
    if (alreadyAdmin) return;
    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao promover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário promovido", description: "Permissão de admin concedida." });
      await qc.invalidateQueries({ queryKey: ["computed-roles"] });
      await qc.invalidateQueries({ queryKey: ["profiles-all"] });
    }
  };

  type PermissionCode = 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage'
  const PERMISSIONS: Array<{ code: PermissionCode; label: string }> = [
    { code: 'estoque.view', label: 'Ver estoque' },
    { code: 'estoque.manage', label: 'Gerenciar estoque' },
    { code: 'entradas.manage', label: 'Gerenciar entradas' },
    { code: 'saidas.manage', label: 'Gerenciar saídas' },
  ]

  const { user } = useAuth();

  const { data: myChildrenIds = new Set<string>(), refetch: refetchChildren, isLoading: loadingChildren } = useQuery({
    queryKey: ["my-children", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_hierarchy")
        .select("child_user_id")
        .eq("parent_user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.child_user_id as string));
    },
  });

  const [permOpen, setPermOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [permMap, setPermMap] = useState<Record<PermissionCode, boolean>>({
    'estoque.view': false,
    'estoque.manage': false,
    'entradas.manage': false,
    'saidas.manage': false,
  });
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const linkChild = async (childId: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_hierarchy").insert({ parent_user_id: user.id, child_user_id: childId });
    if (error) {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subconta vinculada", description: "Agora você pode gerenciar as permissões." });
      await refetchChildren();
    }
  };

  const unlinkChild = async (childId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_hierarchy")
      .delete()
      .eq("parent_user_id", user.id)
      .eq("child_user_id", childId);
    if (error) {
      toast({ title: "Erro ao desvincular", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vínculo removido", description: "Subconta desvinculada." });
      await refetchChildren();
    }
  };

  const openPerms = async (profile: ProfileRow) => {
    setPermTarget({ id: profile.user_id, name: profile.nome });
    setPermOpen(true);
    setLoadingPerms(true);
    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", profile.user_id);
      if (error) throw error;
      const current = new Set((data ?? []).map((r: any) => r.permission as PermissionCode));
      setPermMap({
        'estoque.view': current.has('estoque.view'),
        'estoque.manage': current.has('estoque.manage'),
        'entradas.manage': current.has('entradas.manage'),
        'saidas.manage': current.has('saidas.manage'),
      });
    } catch (err: any) {
      toast({ title: "Erro ao carregar permissões", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPerms(false);
    }
  };

  const savePerms = async () => {
    if (!permTarget) return;
    setSavingPerms(true);
    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", permTarget.id);
      if (error) throw error;
      const current = new Set((data ?? []).map((r: any) => r.permission as PermissionCode));
      const desired = new Set(
        (Object.entries(permMap) as [PermissionCode, boolean][]) // type hint
          .filter(([, v]) => v)
          .map(([k]) => k)
      );
      const toAdd = Array.from(desired).filter((p) => !current.has(p));
      const toRemove = Array.from(current).filter((p) => !desired.has(p));

      await Promise.all([
        ...toAdd.map((p) => supabase.from("user_permissions").insert({ user_id: permTarget.id, permission: p as any })),
        ...toRemove.map((p) =>
          supabase.from("user_permissions").delete().eq("user_id", permTarget.id).eq("permission", p as any)
        ),
      ]);

      toast({ title: "Permissões atualizadas" });
      setPermOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingPerms(false);
    }
  };

  const isLoading = loadingProfiles || loadingRoles || loadingChildren;

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">Visualize todos os usuários e conceda acesso de administrador.</p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <MailPlus className="mr-2" />
                Convidar usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar novo usuário</DialogTitle>
                <DialogDescription>Envie um link de acesso por email. O usuário poderá entrar imediatamente.</DialogDescription>
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

      <section className="rounded-lg border border-border bg-card p-4">
        {isLoading ? (
          <div className="text-muted-foreground">Carregando usuários...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((p) => {
                const label = roleMap?.get(p.user_id) ?? null;
                const isAdmin = label === "Admin";
                return (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">{p.nome ?? "—"}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell>
                      {label ? (
                        <Badge variant={isAdmin ? "default" : "secondary"}>{label}</Badge>
                      ) : (
                        <Badge variant="secondary">sem função</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => makeAdmin(p.user_id)} disabled={isAdmin}>
                          {isAdmin ? "Já é admin" : "Tornar admin"}
                        </Button>
                        {user && p.user_id !== user.id && (
                          myChildrenIds.has(p.user_id) ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => openPerms(p)}>
                                <Settings2 className="mr-1 h-4 w-4" /> Permissões
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => unlinkChild(p.user_id)}>
                                <Unlink className="mr-1 h-4 w-4" /> Desvincular
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => linkChild(p.user_id)}>
                              <LinkIcon className="mr-1 h-4 w-4" /> Vincular subconta
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissões {permTarget?.name ? `de ${permTarget.name}` : "da subconta"}</DialogTitle>
            <DialogDescription>Defina o que a subconta pode ver e operar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {PERMISSIONS.map((perm) => (
              <div key={perm.code} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{perm.label}</div>
                </div>
                <Switch
                  checked={permMap[perm.code]}
                  onCheckedChange={(v) => setPermMap((prev) => ({ ...prev, [perm.code]: v }))}
                  disabled={loadingPerms}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPermOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePerms} disabled={savingPerms || loadingPerms}>
              {savingPerms ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

