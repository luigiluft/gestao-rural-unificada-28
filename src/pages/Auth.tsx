import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  const [roleFromUrl, setRoleFromUrl] = useState<string | null>(null);
  const [depositoFromUrl, setDepositoFromUrl] = useState<string | null>(null);
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

  // Check for role and deposito params in URL (from EncontreDeposito page)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const deposito = urlParams.get('deposito');
    
    if (role) {
      setRoleFromUrl(role);
      setActiveTab("signup"); // Auto-switch to signup for new users
    }
    if (deposito) {
      setDepositoFromUrl(deposito);
      // Store in localStorage for later use in profile setup
      localStorage.setItem('pending_deposito_id', deposito);
    }
  }, []);

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

  const handleLogin = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('🔐 Starting login process for email:', email, 'retry:', retryCount);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('✅ Login successful for user:', data.user?.email, 'ID:', data.user?.id);
      
      // Sistema agora é 100% automático - processamento de convite acontece no backend
      
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
      
      // Retry logic for timeouts or connection issues
      if (retryCount < 2 && (
        err.message?.includes('timeout') || 
        err.message?.includes('connection') ||
        err.message?.includes('network')
      )) {
        console.log('🔄 Retrying login... attempt', retryCount + 1);
        toast.info('Tentando novamente...');
        
        // Wait 2s before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return handleLogin(retryCount + 1);
      }
      
      toast.error(err.message || "Não foi possível fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Sistema agora é 100% automático - processamento de convite acontece no backend
  // Esta função não é mais necessária pois o handle_new_user trigger processa tudo automaticamente

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
      
      // Build user metadata with optional role from URL
      const userData: Record<string, any> = { nome: name };
      if (roleFromUrl) {
        userData.requested_role = roleFromUrl;
      }
      if (depositoFromUrl) {
        userData.requested_deposito = depositoFromUrl;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectUrl, 
          data: userData
        },
      });
      
      if (error) throw error;
      console.log('✅ Signup successful for user:', data.user?.email);
      
      // Sistema agora é 100% automático - o trigger handle_new_user 
      // processa convites, hierarquia e permissões automaticamente
      if (isInviteFlow) {
        toast.success("Cadastro concluído! Sistema processando convite automaticamente...");
        // After successful signup in invite flow, go to login tab
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.success("Conta criada! Sistema configurando perfil automaticamente...");
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
              {isInviteFlow 
                ? "Complete seu cadastro de franqueado" 
                : roleFromUrl === 'cliente'
                  ? "Crie sua conta de cliente"
                  : "Acesse sua conta"}
            </CardTitle>
            {isInviteFlow && (
              <p className="text-sm text-muted-foreground text-center">
                Você foi convidado para se tornar um franqueado. Complete as informações abaixo.
              </p>
            )}
            {roleFromUrl === 'cliente' && !isInviteFlow && (
              <p className="text-sm text-muted-foreground text-center">
                Cadastre-se para armazenar sua produção com a Luft AgroHub.
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
        
        <div className="mt-6 text-center">
          <Link 
            to="/site" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o site
          </Link>
        </div>
      </main>
    </div>
  );
}
