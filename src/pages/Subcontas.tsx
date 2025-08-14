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
import { Switch } from "@/components/ui/switch";
import { MailPlus, Settings2, Unlink, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/empty-state";

interface ProfileRow {
  user_id: string;
  nome: string | null;
  email: string | null;
}

type UserRole = 'admin' | 'franqueado' | 'produtor';
type PermissionCode = 'estoque.view' | 'estoque.manage' | 'entradas.manage' | 'saidas.manage';

const PERMISSIONS: Array<{ code: PermissionCode; label: string }> = [
  { code: 'estoque.view', label: 'Ver estoque' },
  { code: 'estoque.manage', label: 'Gerenciar estoque' },
  { code: 'entradas.manage', label: 'Gerenciar entradas' },
  { code: 'saidas.manage', label: 'Gerenciar saídas' },
];

export default function Subcontas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>('produtor');
  const [selectedFranqueado, setSelectedFranqueado] = useState<string>("");
  const [invitePermissions, setInvitePermissions] = useState<Record<PermissionCode, boolean>>({
    'estoque.view': false,
    'estoque.manage': false,
    'entradas.manage': false,
    'saidas.manage': false,
  });
  const [sendingInvite, setSendingInvite] = useState(false);

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

  // Get current user's role to determine what subaccounts they can create
  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [adminRes, franqRes] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' }),
        supabase.rpc('has_role', { _user_id: user!.id, _role: 'franqueado' }),
      ]);
      
      if (adminRes.data === true) return 'admin';
      if (franqRes.data === true) return 'franqueado';
      return 'produtor';
    },
  });

  // Get available roles for creation based on user role
  const availableRoles = () => {
    switch (userRole) {
      case 'admin':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'franqueado', label: 'Franqueado' },
          { value: 'produtor', label: 'Produtor' },
        ];
      case 'franqueado':
        return [
          { value: 'franqueado', label: 'Franqueado' },
          { value: 'produtor', label: 'Produtor' },
        ];
      case 'produtor':
        return [{ value: 'produtor', label: 'Produtor' }];
      default:
        return [];
    }
  };

  // Get user's subaccounts (children in hierarchy)
  const { data: subaccounts = [], refetch: refetchSubaccounts, isLoading: loadingSubaccounts } = useQuery({
    queryKey: ["subaccounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_hierarchy")
        .select(`
          child_user_id,
          profiles!inner(user_id, nome, email)
        `)
        .eq("parent_user_id", user!.id);
      
      if (error) throw error;
      
      return (data ?? []).map((item: any) => ({
        user_id: item.profiles.user_id,
        nome: item.profiles.nome,
        email: item.profiles.email,
      })) as ProfileRow[];
    },
  });

  // Get roles for subaccounts
  const { data: roleMap = new Map<string, string>() } = useQuery({
    queryKey: ["subaccount-roles", subaccounts.map(s => s.user_id)],
    enabled: subaccounts.length > 0,
    queryFn: async () => {
      const map = new Map<string, string>();
      const results = await Promise.all(
        subaccounts.map(async (s) => {
          const [adminRes, franqRes] = await Promise.all([
            supabase.rpc('has_role', { _user_id: s.user_id, _role: 'admin' }),
            supabase.rpc('has_role', { _user_id: s.user_id, _role: 'franqueado' }),
          ]);
          const isAdmin = adminRes.data === true;
          const isFranqueado = franqRes.data === true;
          const label = isAdmin ? 'Admin' : isFranqueado ? 'Franqueado' : 'Produtor';
          return [s.user_id, label] as const;
        })
      );
      results.forEach(([id, label]) => map.set(id, label));
      return map;
    },
  });

  // Get list of franqueados for admin selection
  const { data: franqueados = [] } = useQuery({
    queryKey: ["franqueados-list"],
    enabled: userRole === 'admin',
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(user_id, nome, email)
        `)
        .eq("role", "franqueado");
      
      if (error) throw error;
      
      return (data ?? []).map((item: any) => ({
        user_id: item.profiles.user_id,
        nome: item.profiles.nome,
        email: item.profiles.email,
      }));
    },
  });

  const sendInvite = async () => {
    if (!inviteEmail || !user) {
      toast({ title: "Dados incompletos", description: "Informe email e função.", variant: "destructive" });
      return;
    }

    // Validate franqueado selection for admin creating produtor
    if (userRole === 'admin' && inviteRole === 'produtor' && !selectedFranqueado) {
      toast({ 
        title: "Franqueado obrigatório", 
        description: "Selecione um franqueado para associar ao produtor.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSendingInvite(true);

      // Determine parent user based on role and rules
      let parentUserId = user.id;
      
      if (userRole === 'admin' && inviteRole === 'produtor') {
        // Admin creating produtor: use selected franqueado
        parentUserId = selectedFranqueado;
      } else if (userRole === 'franqueado' || userRole === 'produtor') {
        // Franqueado or subconta creating: find the master franqueado
        const { data: hierarchy } = await supabase
          .from("user_hierarchy")
          .select(`
            parent_user_id,
            user_roles!inner(role)
          `)
          .eq("child_user_id", user.id)
          .eq("user_roles.role", "franqueado")
          .maybeSingle();
        
        if (hierarchy?.parent_user_id) {
          // This user is a subconta, use the master franqueado
          parentUserId = hierarchy.parent_user_id;
        }
        // If no hierarchy found, user is already a master franqueado, use user.id
      }

      // Get selected permissions
      const selectedPermissions: PermissionCode[] = (Object.entries(invitePermissions) as [PermissionCode, boolean][])
        .filter(([, selected]) => selected)
        .map(([permission]) => permission);

      const { error: inviteError } = await supabase.from("pending_invites").insert({
        email: inviteEmail,
        inviter_user_id: user.id,
        parent_user_id: parentUserId,
        role: inviteRole,
        permissions: selectedPermissions,
      });

      if (inviteError) throw inviteError;

      const { error } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;

      toast({ 
        title: "Convite enviado", 
        description: `Subconta ${inviteRole} será criada automaticamente quando o usuário fizer login.` 
      });
      
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole('produtor');
      setSelectedFranqueado("");
      setInvitePermissions({
        'estoque.view': false,
        'estoque.manage': false,
        'entradas.manage': false,
        'saidas.manage': false,
      });
    } catch (err: any) {
      toast({ title: "Erro ao enviar convite", description: err.message, variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  const unlinkSubaccount = async (subaccountId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("user_hierarchy")
      .delete()
      .eq("parent_user_id", user.id)
      .eq("child_user_id", subaccountId);
    
    if (error) {
      toast({ title: "Erro ao desvincular", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subconta desvinculada" });
      await refetchSubaccounts();
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
        (Object.entries(permMap) as [PermissionCode, boolean][])
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

  useEffect(() => {
    document.title = "Subcontas | AgroStock";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Gerencie suas subcontas e delegue permissões no AgroStock';
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subcontas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie subcontas {userRole === 'admin' ? 'de todos os tipos' : `do tipo ${userRole}`} com permissões limitadas.
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <MailPlus className="mr-2" />
                Criar subconta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar nova subconta</DialogTitle>
                <DialogDescription>
                  A subconta será automaticamente vinculada a você com permissões limitadas.
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
                <div className="grid gap-2">
                  <Label htmlFor="invite-role">Função</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {userRole === 'admin' && inviteRole === 'produtor' && (
                  <div className="grid gap-2">
                    <Label htmlFor="franqueado-select">Franqueado Master *</Label>
                    <Select value={selectedFranqueado} onValueChange={setSelectedFranqueado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um franqueado" />
                      </SelectTrigger>
                      <SelectContent>
                        {franqueados.map((franqueado) => (
                          <SelectItem key={franqueado.user_id} value={franqueado.user_id}>
                            {franqueado.nome || franqueado.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Permissões</Label>
                  <div className="grid gap-3 p-3 border rounded-lg">
                    {PERMISSIONS.map((perm) => (
                      <div key={perm.code} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{perm.label}</div>
                        </div>
                        <Switch
                          checked={invitePermissions[perm.code]}
                          onCheckedChange={(checked) => 
                            setInvitePermissions(prev => ({ ...prev, [perm.code]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => {
                  setInviteOpen(false);
                  setInviteEmail("");
                  setInviteRole('produtor');
                  setSelectedFranqueado("");
                  setInvitePermissions({
                    'estoque.view': false,
                    'estoque.manage': false,
                    'entradas.manage': false,
                    'saidas.manage': false,
                  });
                }}>
                  Cancelar
                </Button>
                <Button onClick={sendInvite} disabled={sendingInvite || !inviteEmail}>
                  {sendingInvite ? "Criando..." : "Criar subconta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        {loadingSubaccounts ? (
          <div className="text-muted-foreground">Carregando subcontas...</div>
        ) : subaccounts.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-muted-foreground" />}
            title="Nenhuma subconta criada"
            description="Crie subcontas para delegar acesso limitado ao sistema"
            action={{
              label: "Criar primeira subconta",
              onClick: () => setInviteOpen(true)
            }}
          />
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
              {subaccounts.map((subaccount) => {
                const role = roleMap.get(subaccount.user_id) ?? 'Produtor';
                return (
                  <TableRow key={subaccount.user_id}>
                    <TableCell className="font-medium">{subaccount.nome ?? "—"}</TableCell>
                    <TableCell>{subaccount.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={role === 'Admin' ? 'default' : 'secondary'}>
                        {role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openPerms(subaccount)}>
                          <Settings2 className="mr-1 h-4 w-4" /> Permissões
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => unlinkSubaccount(subaccount.user_id)}>
                          <Unlink className="mr-1 h-4 w-4" /> Desvincular
                        </Button>
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