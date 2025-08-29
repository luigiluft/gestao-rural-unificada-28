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
import { useSubaccountPermissions } from "@/hooks/useSubaccountPermissions";
import { EmptyState } from "@/components/ui/empty-state";
import { UserRole, PermissionCode, PERMISSIONS } from "@/types/permissions";

interface ProfileRow {
  user_id: string;
  nome: string | null;
  email: string | null;
}

export default function Subcontas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedFranquia, setSelectedFranquia] = useState<string>("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [permOpen, setPermOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [permMap, setPermMap] = useState<Record<PermissionCode, boolean>>({
    'estoque.view': false,
    'estoque.manage': false,
    'entradas.manage': false,
    'saidas.manage': false,
    'relatorios.view': false,
    'usuarios.manage': false,
    'dashboard.view': false,
    'entradas.view': false,
    'saidas.view': false,
    'recebimento.view': false,
    'alocacao.view': false,
    'separacao.view': false,
    'expedicao.view': false,
    'inventario.view': false,
    'rastreio.view': false,
    'perfis-funcionarios.view': false,
  });
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  // Get current user's role to determine what subaccounts they can create
  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user!.id)
        .single();
      
      return profile?.role as UserRole | null;
    },
  });

  // Initialize the permissions hook
  const {
    getSubaccountPermissions,
    getSubaccountRole,
    getSubaccountRoleLabel,
    getSubaccountDescription
  } = useSubaccountPermissions(userRole);

  // Get permissions and role for subaccount (always employee of same role)
  const subaccountRole = getSubaccountRole();
  const subaccountPermissions = getSubaccountPermissions();
  const subaccountRoleLabel = getSubaccountRoleLabel();
  const subaccountDescription = getSubaccountDescription();

  // Prevent rendering until userRole is loaded
  if (!userRole || !subaccountRole) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

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

  // Get list of franquias for admin creating produtor subaccount
  const { data: franquias = [] } = useQuery({
    queryKey: ["franquias-list"],
    enabled: userRole === 'admin' && subaccountRole === 'produtor',
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select(`
          id,
          nome,
          master_franqueado_id,
          profiles!franquias_master_franqueado_id_fkey(nome, email)
        `)
        .eq("ativo", true);
      
      if (error) throw error;
      
      return (data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
        master_franqueado_id: item.master_franqueado_id,
        master_nome: item.profiles.nome || item.profiles.email,
      }));
    },
  });

  const sendInvite = async () => {
    if (!inviteEmail || !user || !subaccountRole) {
      toast({ title: "Dados incompletos", description: "Informe o email.", variant: "destructive" });
      return;
    }

    // Validate franquia selection for admin creating produtor subaccount
    if (userRole === 'admin' && subaccountRole === 'produtor' && !selectedFranquia) {
      toast({ 
        title: "Franquia obrigatória", 
        description: "Selecione uma franquia para associar ao funcionário.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSendingInvite(true);

      // Determine parent user and franquia based on role and rules
      let parentUserId = user.id;
      let franquiaId = null;
      
      if (userRole === 'admin' && subaccountRole === 'produtor') {
        // Admin creating produtor subaccount: use selected franquia's master
        const selectedFranquiaData = franquias.find(f => f.id === selectedFranquia);
        if (selectedFranquiaData) {
          parentUserId = selectedFranquiaData.master_franqueado_id;
          franquiaId = selectedFranquia;
        }
      } else if (userRole === 'franqueado' || userRole === 'produtor') {
        // Franqueado or subconta creating: find the master franqueado and franquia
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
        
        // Get the franquia for this user/master
        if (subaccountRole === 'produtor') {
          const { data: franquiaData } = await supabase
            .from("franquias")
            .select("id")
            .eq("master_franqueado_id", parentUserId)
            .maybeSingle();
          
          if (franquiaData) {
            franquiaId = franquiaData.id;
          }
        }
      }

      const inviteData: any = {
        email: inviteEmail,
        inviter_user_id: user.id,
        parent_user_id: parentUserId,
        role: subaccountRole,
        permissions: subaccountPermissions,
      };

      // Add franquia_id for produtor invites
      if (subaccountRole === 'produtor' && franquiaId) {
        inviteData.franquia_id = franquiaId;
      }

      // Call the edge function to send the invite
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: inviteData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao processar convite');
      }

      if (!data?.success) {
        console.error('Invite function failed:', data);
        throw new Error(data?.error || 'Erro ao enviar convite');
      }

      toast({ 
        title: "Convite enviado", 
        description: `${subaccountRoleLabel} será criado automaticamente quando o usuário fizer login.` 
      });
      
      setInviteOpen(false);
      setInviteEmail("");
      setSelectedFranquia("");
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
        'relatorios.view': current.has('relatorios.view'),
        'usuarios.manage': current.has('usuarios.manage'),
        'dashboard.view': current.has('dashboard.view'),
        'entradas.view': current.has('entradas.view'),
        'saidas.view': current.has('saidas.view'),
        'recebimento.view': current.has('recebimento.view'),
        'alocacao.view': current.has('alocacao.view'),
        'separacao.view': current.has('separacao.view'),
        'expedicao.view': current.has('expedicao.view'),
        'inventario.view': current.has('inventario.view'),
        'rastreio.view': current.has('rastreio.view'),
        'perfis-funcionarios.view': current.has('perfis-funcionarios.view'),
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subcontas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie funcionários {userRole ? `do tipo ${subaccountRoleLabel?.toLowerCase()}` : ''} com permissões limitadas.
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <MailPlus className="mr-2" />
                Criar {subaccountRoleLabel}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Criar {subaccountRoleLabel}</DialogTitle>
                <DialogDescription>
                  {subaccountDescription}
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
                {userRole === 'admin' && subaccountRole === 'produtor' && (
                  <div className="grid gap-2">
                    <Label htmlFor="franquia-select">Franquia *</Label>
                    <Select value={selectedFranquia} onValueChange={setSelectedFranquia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma franquia" />
                      </SelectTrigger>
                      <SelectContent>
                        {franquias.map((franquia) => (
                          <SelectItem key={franquia.id} value={franquia.id}>
                            {franquia.nome} - {franquia.master_nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Permissões ({subaccountPermissions.length} incluídas)</Label>
                  <div className="grid gap-2 p-3 border rounded-lg bg-muted/50">
                    {subaccountPermissions.map((perm) => {
                      const permLabel = PERMISSIONS.find(p => p.code === perm)?.label || perm;
                      return (
                        <div key={perm} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {permLabel}
                        </div>
                      );
                    })}
                    {subaccountPermissions.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma permissão padrão</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => {
                  setInviteOpen(false);
                  setInviteEmail("");
                  setSelectedFranquia("");
                }}>
                  Cancelar
                </Button>
                <Button onClick={sendInvite} disabled={sendingInvite || !inviteEmail}>
                  {sendingInvite ? "Criando..." : `Criar ${subaccountRoleLabel}`}
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
            description="Crie funcionários para delegar acesso limitado ao sistema"
            action={{
              label: `Criar primeiro ${subaccountRoleLabel?.toLowerCase()}`,
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