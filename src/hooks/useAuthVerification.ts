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
  
  // Só verificar permissões de página se pageKey estiver definido
  const { canAccess: canAccessPage, isLoading: pageLoading } = useCanAccessPage(pageKey || "");

  // Verificação de roles com timeout
  useEffect(() => {
    const checkRoleAccess = async () => {
      if (!allowedRoles || !user || !session) {
        setHasRoleAccess(!allowedRoles); // true se não há restrição de role
        return;
      }

      setRoleLoading(true);
      
      // Timeout de 5s para role check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role check timeout')), 5000)
      );

      try {
        const roleCheckPromise = (async () => {
          // Primeiro tenta usar a função RPC
          const { data, error } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: allowedRoles[0] as "admin" | "operador" | "cliente",
          });

          if (!error && data === true) {
            return true;
          }

          // Fallback: verificação direta na tabela profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          return allowedRoles.includes(profile?.role as string || "");
        })();

        const result = await Promise.race([roleCheckPromise, timeoutPromise]) as boolean;
        setHasRoleAccess(result);
      } catch (error) {
        console.error('❌ Role check error or timeout:', error);
        // Em caso de timeout, assumir sem acesso por segurança
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

  // Só verificar permissões de página se tiver sessão e pageKey
  const effectivePageLoading = session && pageKey ? pageLoading : false;
  const isLoading = authLoading || roleLoading || effectivePageLoading;

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

  // Se tem roles requeridos, verificar acesso por role
  if (allowedRoles && !hasRoleAccess) {
    hasAccess = false;
    redirectPath = "/";
  }
  // Se tem pageKey definido, verificar permissão da página
  else if (pageKey && !canAccessPage) {
    hasAccess = false;
    redirectPath = "/";
  }
  // Se não tem pageKey nem allowedRoles, apenas requireAuth importa (já tratado no early return)

  return {
    isLoading,
    hasAccess,
    shouldRedirect: !isLoading && !hasAccess,
    redirectPath
  };
};