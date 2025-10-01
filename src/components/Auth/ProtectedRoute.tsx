import { ReactNode, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const hasRedirectedRef = useRef(false);
  
  const { isLoading, hasAccess, shouldRedirect, redirectPath } = useAuthVerification({
    requireAuth,
    allowedRoles,
    pageKey
  });

  useEffect(() => {
    if (shouldRedirect && !hasRedirectedRef.current) {
      const targetPath = fallbackPath !== "/" ? fallbackPath : redirectPath;
      
      // Debug log
      console.log('🛡️ ProtectedRoute redirect:', { 
        pageKey, 
        from: location.pathname, 
        to: targetPath,
        hasAccess 
      });
      
      // Prevenir redirecionamento para a mesma rota
      if (targetPath === location.pathname) {
        console.warn('⚠️ ProtectedRoute: Prevented redirect to same path:', targetPath);
        return;
      }
      
      hasRedirectedRef.current = true;
      navigate(targetPath, { 
        replace: true, 
        state: { from: location.pathname } 
      });
    }
  }, [shouldRedirect, redirectPath, fallbackPath, navigate, location.pathname, pageKey, hasAccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}