import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function RequireAdminOrFranqueado({ children }: { children: ReactNode }) {
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        const hasRequiredRole = profile?.role === "admin" || profile?.role === "franqueado";
        
        if (!hasRequiredRole) {
          navigate("/", { replace: true, state: { from: location.pathname } });
        }
      } catch {
        navigate("/", { replace: true, state: { from: location.pathname } });
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

  if (!session) return null;

  return <>{children}</>;
}