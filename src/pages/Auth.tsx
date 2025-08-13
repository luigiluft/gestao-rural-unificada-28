import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const token = urlParams.get('token') || urlParams.get('access_token');
    
    if (token) {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
      afterLoginRedirect();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível fazer login");
    } finally {
      setLoading(false);
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
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { nome: name } },
      });
      if (error) throw error;
      
      // If this is an invite flow and signup was successful, process the invite
      if (isInviteFlow && data.user) {
        try {
          // Call the function to complete invite processing
          const { error: rpcError } = await supabase.rpc('complete_invite_signup', {
            _user_id: data.user.id,
            _email: email
          });
          
          if (rpcError) {
            console.error('Error processing invite:', rpcError);
          }
        } catch (inviteError) {
          console.log('Could not process invite:', inviteError);
        }
        
        toast.success("Cadastro de franqueado concluído! Verifique seu e-mail para confirmar o acesso.");
        // After successful signup in invite flow, go to login tab
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar o acesso.");
      }
    } catch (err: any) {
      toast.error(err.message || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
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
