import { useState } from "react"
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

export default function Perfil() {
  const [isEditing, setIsEditing] = useState(false)

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
            <Button className="bg-gradient-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Salvar
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
                <h3 className="font-bold text-lg">João Silva</h3>
                <p className="text-muted-foreground">Administrador</p>
                <p className="text-sm text-muted-foreground mt-1">Fazenda São José</p>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>joao@fazendadesao.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Ribeirão Preto, SP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Pessoal</TabsTrigger>
              <TabsTrigger value="business">Empresa</TabsTrigger>
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
                        defaultValue="João Silva" 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue="joao@fazendadesao.com" 
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input 
                        id="telefone" 
                        defaultValue="(11) 99999-9999" 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input 
                        id="cpf" 
                        defaultValue="000.000.000-00" 
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input 
                      id="endereco" 
                      defaultValue="Rua da Fazenda, 123 - Rural" 
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input 
                        id="cidade" 
                        defaultValue="Ribeirão Preto" 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select disabled={!isEditing}>
                        <SelectTrigger>
                          <SelectValue defaultValue="SP" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          <SelectItem value="GO">Goiás</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input 
                        id="cep" 
                        defaultValue="14000-000" 
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
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
                        defaultValue="Fazenda São José" 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input 
                        id="cnpj" 
                        defaultValue="00.000.000/0001-00" 
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                      <Input 
                        id="inscricaoEstadual" 
                        defaultValue="000.000.000.000" 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoneEmpresa">Telefone Comercial</Label>
                      <Input 
                        id="telefoneEmpresa" 
                        defaultValue="(16) 3000-0000" 
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="atividade">Atividade Principal</Label>
                    <Select disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue defaultValue="agricultura" />
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Alterar Senha</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="senhaAtual">Senha Atual</Label>
                          <Input id="senhaAtual" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novaSenha">Nova Senha</Label>
                          <Input id="novaSenha" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                          <Input id="confirmarSenha" type="password" />
                        </div>
                        <Button>Alterar Senha</Button>
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