import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CompletarCadastro() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    empresa: "",
    senha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    document.title = "Completar Cadastro | AgroStock";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Complete seu cadastro no AgroStock definindo sua senha e informações.";
    if (metaDesc) {
      metaDesc.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  // Check if user came from invite confirmation
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    console.log('URL params:', { token, type, accessToken, refreshToken });
    
    // Allow access if coming from invite or already has tokens
    if (!token && !accessToken && type !== 'invite') {
      console.log('No valid tokens found, redirecting to auth');
      navigate('/auth');
    }
  }, [searchParams, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    if (formData.senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.nome) {
      toast({
        title: "Nome obrigatório",
        description: "Digite seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');

      console.log('Starting signup process...', { token, type, accessToken });

      // If we have access tokens, user is already authenticated from invite
      if (accessToken) {
        console.log('User already authenticated via access token');
      } else if (token && type === 'invite') {
        // Complete the signup process with the token
        const { error: signUpError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'invite'
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }
      }

      // Update user password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.senha
      });

      if (passwordError) throw passwordError;

      // Update profile information
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome,
            telefone: formData.telefone || null,
            empresa: formData.empresa || null,
          })
          .eq('user_id', currentUser.id);

        if (profileError) throw profileError;
      }

      // Sign out the user so they need to login manually
      await supabase.auth.signOut();

      toast({
        title: "Cadastro completado!",
        description: "Agora você pode fazer login com seu email e senha.",
      });

      navigate('/auth');
    } catch (err: any) {
      toast({
        title: "Erro ao completar cadastro",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Completar Cadastro</CardTitle>
          <CardDescription>
            Finalize seu cadastro definindo uma senha e suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                name="empresa"
                type="text"
                placeholder="Nome da empresa"
                value={formData.empresa}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha *</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                "Finalizar Cadastro"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}