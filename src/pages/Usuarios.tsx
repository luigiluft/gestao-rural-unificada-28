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
import { MailPlus, Settings2, Link as LinkIcon, Unlink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel, ROLE_LABELS } from "@/utils/roleTranslations";
import { TablePageLayout } from "@/components/ui/table-page-layout";

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
  const [inviteRole, setInviteRole] = useState<'admin' | 'operador' | 'cliente'>('cliente');
  const [sendingInvite, setSendingInvite] = useState(false);
  
  const sendInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Informe um email", description: "Digite um email válido para enviar o convite.", variant: "destructive" });
      return;
    }
    if (!user) return;

    try {
      setSendingInvite(true);

      // Use edge function to send invite
      const { data: response, error } = await supabase.functions.invoke('send-invite', {
        body: { 
          email: inviteEmail,
          inviter_user_id: user.id,
          parent_user_id: user.id,
          role: inviteRole,
          permissions: inviteRole === 'cliente' ? ['estoque.view'] : [],
          redirect_url: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao enviar convite')
      }
      
      toast({ 
        title: "Convite enviado", 
        description: `Enviamos um link de acesso para o email informado. O usuário será criado como ${getRoleLabel(inviteRole)}.` 
      });
      
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole('cliente');
      await qc.invalidateQueries({ queryKey: ["profiles-all"] });
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
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { action: 'list_profiles' }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao buscar profiles')
      }

      return (response.data ?? []) as ProfileRow[];
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
          const [adminRes, opRes] = await Promise.all([
            supabase.rpc('has_role', { _user_id: p.user_id, _role: 'admin' }),
            supabase.rpc('has_role', { _user_id: p.user_id, _role: 'operador' }),
          ])
          const isAdmin = adminRes.data === true
          const isOperador = opRes.data === true
          
          const role = isAdmin ? 'admin' : isOperador ? 'operador' : 'cliente'
          const label = getRoleLabel(role, false, true)
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
    
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'update_role', 
          data: { user_id: userId, role: 'admin' }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao promover usuário')
      }

      toast({ title: "Usuário promovido", description: "Permissão de admin concedida." });
      await qc.invalidateQueries({ queryKey: ["computed-roles"] });
      await qc.invalidateQueries({ queryKey: ["profiles-all"] });
    } catch (error: any) {
      toast({ title: "Erro ao promover", description: error.message, variant: "destructive" });
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
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'get_children', 
          data: { parent_user_id: user!.id }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao buscar hierarquia')
      }

      return new Set((response.data ?? []).map((r: any) => r.child_user_id as string));
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
    
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'link_child', 
          data: { parent_user_id: user.id, child_user_id: childId }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao vincular usuário')
      }

      toast({ title: "Subconta vinculada", description: "Agora você pode gerenciar as permissões." });
      await refetchChildren();
    } catch (error: any) {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    }
  };

  const unlinkChild = async (childId: string) => {
    if (!user) return;
    
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'unlink_child', 
          data: { parent_user_id: user.id, child_user_id: childId }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao desvincular usuário')
      }

      toast({ title: "Vínculo removido", description: "Subconta desvinculada." });
      await refetchChildren();
    } catch (error: any) {
      toast({ title: "Erro ao desvincular", description: error.message, variant: "destructive" });
    }
  };

  const openPerms = async (profile: ProfileRow) => {
    setPermTarget({ id: profile.user_id, name: profile.nome });
    setPermOpen(true);
    setLoadingPerms(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'get_permissions', 
          data: { user_id: profile.user_id }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao carregar permissões')
      }

      const current = new Set((response.data ?? []).map((r: any) => r.permission as PermissionCode));
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
      const desired = Array.from(
        (Object.entries(permMap) as [PermissionCode, boolean][])
          .filter(([, v]) => v)
          .map(([k]) => k)
      );

      const { data: response, error } = await supabase.functions.invoke('manage-usuarios', {
        body: { 
          action: 'update_permissions', 
          data: { 
            user_id: permTarget.id, 
            permissions: desired 
          }
        }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao atualizar permissões')
      }

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
    <>
      <TablePageLayout
        title="Usuários"
        description="Gerencie todos os usuários da plataforma e suas funções"
        actionButton={
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <MailPlus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por email para criar um novo usuário na plataforma.
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
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">{ROLE_LABELS.cliente}</SelectItem>
                    <SelectItem value="operador">{ROLE_LABELS.operador}</SelectItem>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                  </SelectContent>
                </Select>
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
      }
      tableContent={
        isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
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
                        <div className="flex items-center justify-end gap-2 flex-wrap">
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
          </div>
        )
      }
      />

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
    </>
  );
}

