import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/auth", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, session, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session) return null; // redirecionando

  return <>{children}</>;
}
