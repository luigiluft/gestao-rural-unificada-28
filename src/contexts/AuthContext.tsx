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
    let isCheckingProfile = false;
    
    const checkProfile = async (u: User) => {
      if (isCheckingProfile) return;
      isCheckingProfile = true;
      
      try {
        console.log('🔍 Checking profile for user:', u.id, u.email);
        
        // Check if profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, nome, email, role')
          .eq('user_id', u.id)
          .maybeSingle();
          
        if (error) {
          console.error('❌ Error fetching profile:', error);
          isCheckingProfile = false;
          return;
        }

        if (!profile) {
          console.log('⏳ Profile not found, waiting for trigger to create...');
          isCheckingProfile = false;
          // Profile should be created by trigger, wait a bit and try again
          setTimeout(() => checkProfile(u), 1000);
          return;
        }

        console.log('✅ Profile found:', profile);

        // Check if user needs to complete registration
        const hasDefaultName = !profile.nome || profile.nome === u.email?.split('@')[0];
        const needsCompletion = hasDefaultName;

        if (needsCompletion && window.location.pathname !== '/completar-cadastro') {
          console.log('🔄 Redirecting to complete registration');
          setTimeout(() => {
            window.location.href = '/completar-cadastro';
          }, 100);
          isCheckingProfile = false;
          return;
        }

        // Sistema agora é 100% automático - invite processing acontece no backend via trigger
        console.log('✅ Profile check completed successfully');
        isCheckingProfile = false;
        
      } catch (e) {
        console.error('❌ Profile check failed:', e);
        isCheckingProfile = false;
      }
    };

    let initialSessionHandled = false;

    // Listen first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔄 Auth state change:', event, newSession?.user?.email);
      
      // Ignore INITIAL_SESSION if we already handled it
      if (event === 'INITIAL_SESSION' && initialSessionHandled) {
        return;
      }
      
      if (event === 'INITIAL_SESSION') {
        initialSessionHandled = true;
      }
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user && event !== 'INITIAL_SESSION') {
        setTimeout(() => checkProfile(newSession.user as User), 0);
      }
      
      if (loading) setLoading(false);
    });

    // Then get current session
    supabase.auth.getSession().then(({ data }) => {
      console.log('🔍 Getting current session:', data.session?.user?.email);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        initialSessionHandled = true;
        setTimeout(() => checkProfile(data.session!.user as User), 0);
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
