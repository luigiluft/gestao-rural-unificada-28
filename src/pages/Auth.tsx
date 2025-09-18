import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  useEffect(() => {
    // If user has a session but came from invite, force logout to complete registration
    if (session && isInviteFlow) {
      supabase.auth.signOut();
      return;
    }
    // Don't redirect invited users to home page
    if (session && !isInviteFlow) {
      navigate("/", { replace: true });
    }
  }, [session, navigate, isInviteFlow]);

  // Check for invite parameters in URL and pre-fill email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite_token');
    const token = urlParams.get('token') || urlParams.get('access_token');
    
    if (inviteToken) {
      // New invite flow with token
      setIsInviteFlow(true);
      setActiveTab("signup"); // Open signup tab for invited users
      
      // Get email from pending_invites using the token (with expiration check)
      const getEmailFromInviteToken = async () => {
        try {
          const { data: email, error } = await supabase.rpc('get_invite_email', {
            _invite_token: inviteToken
          });
          
          if (email && !error) {
            setInviteEmail(email);
            setEmail(email);
          } else {
            console.log('Invalid or expired invite token');
            toast.error('Convite inválido ou expirado');
            // If token is invalid, don't pre-fill or disable the email field
            setIsInviteFlow(false);
          }
        } catch (error) {
          console.log('Could not get email from invite token:', error);
          toast.error('Convite inválido ou expirado');
          setIsInviteFlow(false);
        }
      };
      
      getEmailFromInviteToken();
    } else if (token) {
      // Legacy invite flow (from old inviteUserByEmail)
      setIsInviteFlow(true);
      setActiveTab("signup"); // Open signup tab for invited users
      
      // Try to get email from token
      const getEmailFromToken = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user?.email) {
            setInviteEmail(user.email);
            setEmail(user.email);
          }
        } catch (error) {
          console.log('Could not get email from token:', error);
          setIsInviteFlow(false);
        }
      };
      
      getEmailFromToken();
    }
  }, []);

  useEffect(() => {
    document.title = "Login | Sistema de Estoque";
    const meta = document.querySelector('meta[name="description"]');
    const description = "Faça login ou crie sua conta para acessar o sistema de estoque";
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }
    const linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = `${window.location.origin}/auth`;
      document.head.appendChild(l);
    }
  }, []);

  const afterLoginRedirect = () => {
    const from = (location.state as any)?.from || "/";
    navigate(from, { replace: true });
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log('🔐 Starting login process for email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('✅ Login successful for user:', data.user?.email, 'ID:', data.user?.id);
      
      // Process any pending invites with retry logic
      if (data.user) {
        await processInviteWithRetry(data.user.id, email, 3);
      }
      
      // Check if user needs to change password on first login
      const mustChangePassword = data.user?.user_metadata?.must_change_password;
      
      if (mustChangePassword) {
        toast.success("Login realizado! Redirecionando para alterar sua senha padrão.");
        navigate("/perfil?tab=security", { replace: true });
      } else {
        toast.success("Login realizado com sucesso!");
        afterLoginRedirect();
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      toast.error(err.message || "Não foi possível fazer login");
    } finally {
      setLoading(false);
    }
  };

  const processInviteWithRetry = async (userId: string, userEmail: string, retries: number) => {
    try {
      console.log('🔍 Checking for pending invites for:', userEmail, 'retries left:', retries);
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_invite_signup', {
        _user_id: userId,
        _email: userEmail
      });
      
      if (rpcError) {
        console.error('❌ Error processing invite:', rpcError);
        if (retries > 0) {
          console.log('🔄 Retrying invite processing...');
          setTimeout(() => processInviteWithRetry(userId, userEmail, retries - 1), 1000);
        }
        return;
      }
      
      if (rpcResult) {
        console.log('✅ Invite processed successfully');
        toast.success("Convite processado com sucesso! Redirecionando...");
        // Force page reload to update role
        setTimeout(() => window.location.reload(), 500);
      } else {
        console.log('ℹ️ No pending invites found for this email');
      }
    } catch (error) {
      console.error('❌ Error in invite processing:', error);
      if (retries > 0) {
        setTimeout(() => processInviteWithRetry(userId, userEmail, retries - 1), 1000);
      }
    }
  };

  const handleSignup = async () => {
    try {
      if (!name.trim()) {
        toast.error("Informe seu nome.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem.");
        return;
      }
      
      setLoading(true);
      console.log('🔐 Starting signup process for:', email, 'invite flow:', isInviteFlow);
      
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectUrl, 
          data: { nome: name }
        },
      });
      
      if (error) throw error;
      console.log('✅ Signup successful for user:', data.user?.email);
      
      // Success messages and flow handling
      if (isInviteFlow) {
        toast.success("Cadastro concluído! Verifique seu e-mail para confirmar o acesso.");
        // After successful signup in invite flow, go to login tab
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar o acesso.");
      }
      
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      toast.error(err.message || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!newPassword.trim()) {
        toast.error("Informe a nova senha.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("As senhas não coincidem.");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      setChangingPassword(true);
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;

      // Remove the must_change_password flag
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { must_change_password: false }
      });

      if (metadataError) {
        console.error('Error updating metadata:', metadataError);
      }

      toast.success("Senha alterada com sucesso!");
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      afterLoginRedirect();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível alterar a senha");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-center">
              {isInviteFlow ? "Complete seu cadastro de franqueado" : "Acesse sua conta"}
            </CardTitle>
            {isInviteFlow && (
              <p className="text-sm text-muted-foreground text-center">
                Você foi convidado para se tornar um franqueado. Complete as informações abaixo.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input 
                      id="email2" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      disabled={isInviteFlow && !!inviteEmail}
                      className={isInviteFlow && !!inviteEmail ? "disabled:opacity-60" : ""}
                      required 
                    />
                    {isInviteFlow && !!inviteEmail && (
                      <p className="text-xs text-muted-foreground">
                        Este email veio do seu convite de franqueado
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Senha</Label>
                    <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Já possui conta? <Link to="/auth" className="underline">Entrar</Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
