import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ProfileRow {
  user_id: string;
  nome: string | null;
  email: string | null;
}

export default function Usuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();

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
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" as any }, { onConflict: "user_id,role" });
    if (error) {
      toast({ title: "Erro ao promover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário promovido", description: "Permissão de admin concedida." });
      await qc.invalidateQueries({ queryKey: ["computed-roles"] });
      await qc.invalidateQueries({ queryKey: ["profiles-all"] });
    }
  };

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">Visualize todos os usuários e conceda acesso de administrador.</p>
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
                      <Button size="sm" onClick={() => makeAdmin(p.user_id)} disabled={isAdmin}>
                        {isAdmin ? "Já é admin" : "Tornar admin"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
