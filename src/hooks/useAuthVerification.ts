import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCanAccessPage } from "@/hooks/useSimplifiedPermissions";
import { supabase } from "@/integrations/supabase/client";

interface AuthVerificationOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  pageKey?: string;
}

interface AuthVerificationResult {
  isLoading: boolean;
  hasAccess: boolean;
  shouldRedirect: boolean;
  redirectPath: string;
}

export const useAuthVerification = ({
  requireAuth = true,
  allowedRoles,
  pageKey
}: AuthVerificationOptions): AuthVerificationResult => {
  const { session, loading: authLoading, user } = useAuth();
  const [roleLoading, setRoleLoading] = useState(false);
  const [hasRoleAccess, setHasRoleAccess] = useState(true);
  
  const { canAccess: canAccessPage, isLoading: pageLoading } = useCanAccessPage(pageKey || "");

  // Verificação de roles
  useEffect(() => {
    const checkRoleAccess = async () => {
      if (!allowedRoles || !user || !session) {
        setHasRoleAccess(!allowedRoles); // true se não há restrição de role
        return;
      }

      setRoleLoading(true);
      try {
        // Primeiro tenta usar a função RPC
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: allowedRoles[0] as "admin" | "franqueado" | "produtor", // Para compatibilidade com função existente
        });

        if (!error && data === true) {
          setHasRoleAccess(true);
          setRoleLoading(false);
          return;
        }

        // Fallback: verificação direta na tabela profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        setHasRoleAccess(allowedRoles.includes(profile?.role as string || ""));
      } catch {
        setHasRoleAccess(false);
      } finally {
        setRoleLoading(false);
      }
    };

    if (!authLoading) {
      checkRoleAccess();
    }
  }, [allowedRoles, user, session, authLoading]);

  // Early return: Se requireAuth e não tem sessão após auth carregar, redirecionar imediatamente
  if (requireAuth && !authLoading && !session) {
    return {
      isLoading: false,
      hasAccess: false,
      shouldRedirect: true,
      redirectPath: "/auth"
    };
  }

  // Só verificar permissões de página se tiver sessão
  const effectivePageLoading = session ? pageLoading : false;
  const isLoading = authLoading || roleLoading || (pageKey ? effectivePageLoading : false);

  // Determinar acesso e redirecionamento
  let hasAccess = true;
  let redirectPath = "/";

  // Debug log
  console.log('🔍 AuthVerification:', { 
    pageKey, 
    authLoading, 
    hasUser: !!user,
    hasSession: !!session,
    roleLoading, 
    pageLoading, 
    hasRoleAccess, 
    canAccessPage, 
    redirectPath,
    isLoading
  });

  if (allowedRoles && !hasRoleAccess) {
    hasAccess = false;
    redirectPath = "/";
  } else if (pageKey && !canAccessPage) {
    hasAccess = false;
    redirectPath = "/";
  }

  return {
    isLoading,
    hasAccess,
    shouldRedirect: !isLoading && !hasAccess,
    redirectPath
  };
};