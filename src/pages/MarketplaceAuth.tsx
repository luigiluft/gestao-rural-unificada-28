import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { PlatformLogo } from "@/components/Marketplace/PlatformLogo"

export default function MarketplaceAuth() {
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupNome, setSignupNome] = useState("")
  const [signupTelefone, setSignupTelefone] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos")
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success("Login realizado com sucesso!")
      navigate("/marketplace/minha-conta")
    } catch (err) {
      toast.error("Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupNome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    
    setIsLoading(true)

    try {
      const redirectUrl = `${window.location.origin}/marketplace`

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: signupNome,
            telefone: signupTelefone,
            role: 'consumidor',
            loja_origem: 'marketplace',
          }
        }
      })

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.")
        } else {
          toast.error(error.message)
        }
        return
      }

      // Create profile for the new user
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: data.user.id,
            nome: signupNome,
            telefone: signupTelefone,
            role: 'consumidor'
          })

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }

      toast.success("Conta criada com sucesso! Verifique seu e-mail para confirmar.")
      navigate("/marketplace/minha-conta")
    } catch (err) {
      toast.error("Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/marketplace" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PlatformLogo to="/marketplace" size="sm" />
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Entre ou crie uma conta para comprar no Marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Nome completo</Label>
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-telefone">Telefone (opcional)</Label>
                    <Input
                      id="signup-telefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={signupTelefone}
                      onChange={(e) => setSignupTelefone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}