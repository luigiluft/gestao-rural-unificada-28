import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings, 
  Bell,
  Shield,
  CreditCard,
  Building,
  Save,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/hooks/useProfile"

export default function Perfil() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: userProfile, isLoading: profileLoading } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Get default tab from URL params, avoiding business tab for admins
  const isAdmin = userProfile?.role === 'admin'
  const defaultTab = searchParams.get("tab") === "business" && isAdmin ? "personal" : (searchParams.get("tab") || "personal")

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) {
        console.error("Erro ao carregar perfil", error)
        toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" })
      }
      setProfile({
        nome: data?.nome ?? "",
        email: data?.email ?? (user.email ?? ""),
        telefone: data?.telefone ?? "",
        cpf_cnpj: data?.cpf_cnpj ?? "",
        endereco: data?.endereco ?? "",
        cidade: data?.cidade ?? "",
        estado: data?.estado ?? "",
        cep: data?.cep ?? "",
      })
      setLoading(false)
    }
    load()
  }, [user])

  const handleChange = (field: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: profile.nome,
        email: profile.email,
        telefone: profile.telefone,
        cpf_cnpj: profile.cpf_cnpj,
        endereco: profile.endereco,
        cidade: profile.cidade,
        estado: profile.estado,
        cep: profile.cep,
      })
      .eq("user_id", user.id)
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." })
      setIsEditing(false)
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (!user) return

    if (!passwordData.currentPassword.trim()) {
      toast({ title: "Erro", description: "Informe sua senha atual", variant: "destructive" })
      return
    }

    if (!passwordData.newPassword.trim()) {
      toast({ title: "Erro", description: "Informe a nova senha", variant: "destructive" })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" })
      return
    }

    setChangingPassword(true)

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword
      })

      if (verifyError) {
        toast({ title: "Erro", description: "Senha atual incorreta", variant: "destructive" })
        setChangingPassword(false)
        return
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) throw updateError

      // Remove the must_change_password flag if it exists
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { must_change_password: false }
      })

      if (metadataError) {
        console.error('Error updating metadata:', metadataError)
      }

      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" })
      
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      // If this was a mandatory password change, redirect to dashboard
      if (user.user_metadata?.must_change_password) {
        setTimeout(() => {
          navigate("/", { replace: true })
        }, 1500)
      }

    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível alterar a senha", variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
          {isEditing && (
            <Button className="bg-gradient-primary hover:bg-primary/90" onClick={handleSave} disabled={saving || loading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-bold text-lg">{profile.nome || user?.email || 'Usuário'}</h3>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email || user?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.telefone || '—'}</span>
                  </div>
                  {userProfile?.role === 'produtor' && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.cidade ? `${profile.cidade}${profile.estado ? `, ${profile.estado}` : ''}` : '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-4'}`}>
              <TabsTrigger value="personal">Pessoal</TabsTrigger>
              {!isAdmin && <TabsTrigger value="business">Empresa</TabsTrigger>}
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Atualize seus dados pessoais e de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input 
                        id="nome" 
                        value={profile.nome}
                        onChange={handleChange('nome')}
                        disabled={!isEditing || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profile.email}
                        onChange={handleChange('email')}
                        disabled={!isEditing || loading}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input 
                        id="telefone" 
                        value={profile.telefone}
                        onChange={handleChange('telefone')}
                        disabled={!isEditing || loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF/CNPJ</Label>
                      <Input 
                        id="cpf" 
                        value={profile.cpf_cnpj}
                        onChange={handleChange('cpf_cnpj')}
                        disabled={!isEditing || loading}
                      />
                    </div>
                  </div>

                  {userProfile?.role === 'produtor' && (
                    <>
                      <div className="space-y-2">
                          <Label htmlFor="endereco">Endereço</Label>
                          <Input 
                            id="endereco" 
                            value={profile.endereco}
                            onChange={handleChange('endereco')}
                            disabled={!isEditing || loading}
                          />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input 
                            id="cidade" 
                            value={profile.cidade}
                            onChange={handleChange('cidade')}
                            disabled={!isEditing || loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Select disabled={!isEditing || loading} value={profile.estado || undefined} onValueChange={(v) => setProfile((p) => ({ ...p, estado: v }))}>
                            <SelectTrigger id="estado">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <Input 
                            id="cep" 
                            value={profile.cep}
                            onChange={handleChange('cep')}
                            disabled={!isEditing || loading}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {!isAdmin && (
              <TabsContent value="business" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Informações da Empresa
                    </CardTitle>
                    <CardDescription>
                      Dados da fazenda e informações fiscais
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeEmpresa">Nome da Fazenda</Label>
                        <Input 
                          id="nomeEmpresa" 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input 
                          id="cnpj" 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                        <Input 
                          id="inscricaoEstadual" 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefoneEmpresa">Telefone Comercial</Label>
                        <Input 
                          id="telefoneEmpresa" 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="atividade">Atividade Principal</Label>
                        <Select disabled={!isEditing}>
                          <SelectTrigger id="atividade">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agricultura">Agricultura</SelectItem>
                            <SelectItem value="pecuaria">Pecuária</SelectItem>
                            <SelectItem value="mista">Atividade Mista</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea 
                        id="observacoes" 
                        placeholder="Informações adicionais sobre a empresa..."
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>
                    Configure quando e como você quer receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium">Estoque baixo</h4>
                        <p className="text-sm text-muted-foreground">
                          Receber alertas quando produtos estiverem com estoque baixo
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium">Notificações por e-mail</h4>
                        <p className="text-sm text-muted-foreground">
                          Receber resumos diários por e-mail
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium">Atualizações de pedidos</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificações sobre mudanças no status dos pedidos
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium">Relatórios automáticos</h4>
                        <p className="text-sm text-muted-foreground">
                          Receber relatórios semanais automaticamente
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium">Notificações push</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificações instantâneas no navegador
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Segurança
                  </CardTitle>
                  <CardDescription>
                    Gerencie a segurança da sua conta
                  </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                   {user?.user_metadata?.must_change_password && (
                     <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                       <h4 className="font-medium text-destructive mb-2">⚠️ Alteração de Senha Obrigatória</h4>
                       <p className="text-sm text-muted-foreground">
                         Por segurança, você deve alterar sua senha padrão antes de continuar usando a plataforma.
                       </p>
                     </div>
                   )}
                   <div className="space-y-4">
                     <div>
                       <h4 className="font-medium mb-2">Alterar Senha</h4>
                       <div className="space-y-3">
                         <div className="space-y-2">
                           <Label htmlFor="senhaAtual">Senha Atual</Label>
                           <Input 
                             id="senhaAtual" 
                             type="password" 
                             value={passwordData.currentPassword}
                             onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                             placeholder="Digite sua senha atual"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="novaSenha">Nova Senha</Label>
                           <Input 
                             id="novaSenha" 
                             type="password" 
                             value={passwordData.newPassword}
                             onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                             placeholder="Digite sua nova senha (mín. 6 caracteres)"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                           <Input 
                             id="confirmarSenha" 
                             type="password" 
                             value={passwordData.confirmPassword}
                             onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                             placeholder="Confirme sua nova senha"
                           />
                         </div>
                         <Button 
                           onClick={handlePasswordChange}
                           disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                         >
                           {changingPassword ? "Alterando..." : "Alterar Senha"}
                         </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Autenticação de Dois Fatores</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                      <Button variant="outline">Configurar 2FA</Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Sessões Ativas</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Gerencie dispositivos conectados à sua conta
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <span>Chrome no Windows • São Paulo, SP</span>
                          <Badge variant="outline">Atual</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <span>Safari no iPhone • São Paulo, SP</span>
                          <Button variant="outline" size="sm">Remover</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}