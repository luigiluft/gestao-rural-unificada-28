import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading, user } = useAuth();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      if (!session || !user) {
        setChecking(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (!error && data === true) {
          setChecking(false);
          return;
        }
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === "admin");
        if (!isAdmin) {
          navigate("/", { replace: true, state: { from: location.pathname } });
        }
      } finally {
        setChecking(false);
      }
    };
    if (!loading) check();
  }, [loading, session, user, navigate, location.pathname]);

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Verificando permissões...</div>
      </div>
    );
  }

  if (!session) return null; // redirecionando pelo RequireAuth

  return <>{children}</>;
}
