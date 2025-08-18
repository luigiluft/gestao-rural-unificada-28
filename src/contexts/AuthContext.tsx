import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ 
  user: null, 
  session: null, 
  loading: true, 
  logout: async () => {} 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async (u: User) => {
      try {
        const { data: existing, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', u.id)
          .maybeSingle();
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          return;
        }
        if (!existing) {
          const displayName = (u.user_metadata as any)?.nome || (u.email?.split('@')[0] || 'Usuário');
          await supabase.from('profiles').insert({
            user_id: u.id,
            nome: displayName,
            email: u.email ?? null,
            role: 'produtor', // role padrão
          });
        }

        // Check and process pending invites after creating/finding profile
        try {
          console.log('Checking for pending invites for user:', u.email);
          const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_invite_signup', {
            _user_id: u.id,
            _email: u.email || ''
          });
          
          console.log('Invite processing result:', { rpcResult, rpcError });
          
          if (rpcResult) {
            console.log('Invite processed successfully for user:', u.email);
            // Force a page reload to update the role in the UI
            setTimeout(() => window.location.reload(), 100);
          }
        } catch (inviteError) {
          console.error('Error processing invite:', inviteError);
        }
      } catch (e) {
        console.error('Falha ao garantir perfil', e);
      }
    };

    // Listen first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => ensureProfile(newSession.user as User), 0);
      }
      if (loading) setLoading(false);
    });

    // Then get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setTimeout(() => ensureProfile(data.session!.user as User), 0);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      // Clear state immediately
      setUser(null);
      setSession(null);
      
      // Clear localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to auth page
      window.location.href = "/auth";
    } catch (error) {
      console.error('Erro no logout:', error);
      // Even if signOut fails, clear local state and redirect
      setUser(null);
      setSession(null);
      window.location.href = "/auth";
    }
  };

  const value = useMemo(() => ({ user, session, loading, logout }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
