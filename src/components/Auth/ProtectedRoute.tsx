import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthVerification } from "@/hooks/useAuthVerification";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  pageKey?: string;
  fallbackPath?: string;
  loadingMessage?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  allowedRoles,
  pageKey,
  fallbackPath = "/",
  loadingMessage = "Verificando permissões..."
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoading, hasAccess, shouldRedirect, redirectPath } = useAuthVerification({
    requireAuth,
    allowedRoles,
    pageKey
  });

  useEffect(() => {
    if (shouldRedirect) {
      const targetPath = fallbackPath !== "/" ? fallbackPath : redirectPath;
      navigate(targetPath, { 
        replace: true, 
        state: { from: location.pathname } 
      });
    }
  }, [shouldRedirect, redirectPath, fallbackPath, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}