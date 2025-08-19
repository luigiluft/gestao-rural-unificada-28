import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCanAccessPage } from "@/hooks/usePagePermissions";

interface RequirePageAccessProps {
  children: ReactNode;
  pageKey: string;
}

export function RequirePageAccess({ children, pageKey }: RequirePageAccessProps) {
  const { canAccess, isLoading } = useCanAccessPage(pageKey);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !canAccess) {
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [isLoading, canAccess, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Verificando permissões...</div>
      </div>
    );
  }

  if (!canAccess) return null;

  return <>{children}</>;
}