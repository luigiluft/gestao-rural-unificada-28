import { useState } from "react"
import { Plus, Users, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProfile } from "@/hooks/useProfile"
import { useEmployeeProfiles } from "@/hooks/useEmployeeProfiles"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { type PermissionTemplate, type PermissionCode, type UserRole } from "@/types/permissions"

const AVAILABLE_PERMISSIONS = {
  franqueado: [
    { code: 'dashboard.view', label: 'Dashboard' },
    { code: 'catalogo.view', label: 'Catálogo' },
    
    // Gestão de Entrada
    { code: 'entradas.view', label: 'Visualizar Entradas' },
    { code: 'entradas.manage', label: 'Gerenciar Entradas' },
    
    // Estoque
    { code: 'estoque.view', label: 'Visualizar Estoque' },
    { code: 'estoque.manage', label: 'Gerenciar Estoque' },
    
    // Gestão de Saída
    { code: 'saidas.view', label: 'Visualizar Saídas' },
    { code: 'saidas.manage', label: 'Gerenciar Saídas' },
    
    // WMS - Warehouse Management System
    { code: 'recebimento.view', label: 'Central de Recebimento' },
    { code: 'alocacao-pallets.view', label: 'Alocação de Pallets' },
    { code: 'gerenciar-posicoes.view', label: 'Gerenciar Posições' },
    { code: 'inventario.view', label: 'Inventário' },
    { code: 'separacao.view', label: 'Central de Separação' },
    { code: 'expedicao.view', label: 'Central de Expedição' },
    
    // TMS - Transportation Management System
    { code: 'remessas.view', label: 'Remessas' },
    { code: 'viagens.view', label: 'Viagens' },
    { code: 'agenda.view', label: 'Agenda' },
    { code: 'tracking.view', label: 'Tracking' },
    { code: 'proof-of-delivery.view', label: 'Proof of Delivery' },
    { code: 'proof-of-delivery.manage', label: 'Gerenciar Proof of Delivery' },
    { code: 'comprovantes.view', label: 'Comprovantes de Entrega' },
    { code: 'ocorrencias.view', label: 'Ocorrências' },
    { code: 'tabela-frete.view', label: 'Tabela de Frete' },
    { code: 'tabelas-frete.view', label: 'Tabelas de Frete' },
    { code: 'veiculos.view', label: 'Visualizar Veículos' },
    { code: 'veiculos.manage', label: 'Gerenciar Veículos' },
    { code: 'motoristas.view', label: 'Visualizar Motoristas' },
    { code: 'motoristas.manage', label: 'Gerenciar Motoristas' },
    { code: 'motorista.deliveries.view', label: 'Entregas de Motorista' },
    
    // Relatórios e Rastreamento
    { code: 'rastreio.view', label: 'Rastreamento' },
    { code: 'relatorios.view', label: 'Relatórios' },
    
    // Gestão de Usuários e Clientes
    { code: 'produtores.view', label: 'Produtores' },
    { code: 'fazendas.view', label: 'Fazendas' },
    { code: 'subcontas.view', label: 'Subcontas' },
    { code: 'perfis-funcionarios.view', label: 'Perfis de Funcionários' },
    
    // Sistema
    { code: 'perfil.view', label: 'Perfil' },
    { code: 'instrucoes.view', label: 'Instruções' },
    { code: 'suporte.view', label: 'Suporte' },
    { code: 'configuracoes.view', label: 'Configurações' },
    { code: 'controle-acesso.view', label: 'Controle de Acesso' },
  ],
  cliente: [
    { code: 'dashboard.view', label: 'Dashboard' },
    { code: 'catalogo.view', label: 'Catálogo' },
    { code: 'entradas.view', label: 'Visualizar Entradas' },
    { code: 'entradas.manage', label: 'Gerenciar Entradas' },
    { code: 'estoque.view', label: 'Visualizar Estoque' },
    { code: 'saidas.view', label: 'Visualizar Saídas' },
    { code: 'saidas.manage', label: 'Gerenciar Saídas' },
    { code: 'rastreio.view', label: 'Rastreamento' },
    { code: 'relatorios.view', label: 'Relatórios' },
    { code: 'fazendas.view', label: 'Fazendas' },
    { code: 'perfil.view', label: 'Perfil' },
    { code: 'suporte.view', label: 'Suporte' },
    { code: 'instrucoes.view', label: 'Instruções' },
  ]
}

export default function PerfisFuncionarios() {
  const { data: profile } = useProfile()
  const userRole = profile?.role as 'franqueado' | 'cliente'
  const { profiles, isLoading, createProfile, updateProfile, deleteProfile, isCreating, isUpdating, isDeleting } = useEmployeeProfiles(userRole, true)
  
  const [editingProfile, setEditingProfile] = useState<PermissionTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissions: [] as PermissionCode[],
    default_route: ''
  })

  const handleCreateProfile = () => {
    setEditingProfile(null)
    setFormData({ nome: '', descricao: '', permissions: [], default_route: '' })
    setIsDialogOpen(true)
  }

  const handleEditProfile = (profile: PermissionTemplate) => {
    setEditingProfile(profile)
    setFormData({
      nome: profile.nome,
      descricao: profile.descricao || '',
      permissions: profile.permissions,
      default_route: profile.default_route || ''
    })
    setIsDialogOpen(true)
  }

  const handleSaveProfile = () => {
    if (!formData.nome.trim()) return

    const profileData = {
      user_id: profile!.user_id,
      nome: formData.nome,
      descricao: formData.descricao,
      permissions: formData.permissions,
      target_role: userRole,
      is_template: true,
      default_route: formData.default_route || null,
    }

    if (editingProfile) {
      updateProfile({ id: editingProfile.id, ...profileData })
    } else {
      createProfile(profileData)
    }

    setIsDialogOpen(false)
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission as PermissionCode]
        : prev.permissions.filter(p => p !== permission)
    }))
  }

  const availablePermissions = AVAILABLE_PERMISSIONS[userRole] || []
  const roleLabel = userRole === 'franqueado' ? 'Franqueado' : 'Cliente'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  // Separate profiles by role for better organization
  const myProfiles = profiles.filter(p => p.target_role === userRole)
  const clientProfiles = userRole === 'franqueado' ? profiles.filter(p => p.target_role === 'cliente') : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfis de Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os perfis de acesso para funcionários {userRole === 'franqueado' ? 'da franquia' : 'do produtor'}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateProfile}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-screen h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingProfile ? 'Editar Perfil' : 'Criar Novo Perfil'}
              </DialogTitle>
              <DialogDescription>
                Configure as permissões para o perfil de funcionário {roleLabel.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-6 pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Perfil</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Recebimento, Separação..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descreva as responsabilidades deste perfil..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="default_route">Página Inicial após Login</Label>
                    <select
                      id="default_route"
                      value={formData.default_route}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_route: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione uma página (opcional)</option>
                      <option value="/dashboard">Dashboard</option>
                      <option value="/proof-of-delivery">Comprovantes de Entrega</option>
                      <option value="/entradas">Entradas</option>
                      <option value="/saidas">Saídas</option>
                      <option value="/estoque">Estoque</option>
                      <option value="/recebimento">Central de Recebimento</option>
                      <option value="/alocacao-pallets">Alocação de Pallets</option>
                      <option value="/separacao">Central de Separação</option>
                      <option value="/viagens">Viagens</option>
                      <option value="/motorista-deliveries">Entregas do Motorista</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Página para onde o usuário será redirecionado após fazer login
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Permissões</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione as funcionalidades que este perfil terá acesso
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availablePermissions.map((permission) => (
                      <div key={permission.code} className="flex items-start space-x-2 p-2 rounded-md border border-border/50 hover:border-border transition-colors">
                        <Checkbox
                          id={permission.code}
                          checked={formData.permissions.includes(permission.code as PermissionCode)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.code, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <Label htmlFor={permission.code} className="text-sm leading-5 cursor-pointer flex-1">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-border/50 flex-shrink-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={!formData.nome.trim() || isCreating || isUpdating}
              >
                {editingProfile ? 'Atualizar' : 'Criar'} Perfil
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Profiles Section */}
      {myProfiles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Perfis ({roleLabel})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myProfiles.map((profile) => (
              <Card key={profile.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{profile.nome}</CardTitle>
                      <Badge variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {roleLabel}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProfile(profile)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Perfil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o perfil "{profile.nome}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteProfile(profile.id)}
                              disabled={isDeleting}
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {profile.descricao}
                    </p>
                  )}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Permissões ({profile.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.permissions.slice(0, 3).map((permission) => {
                        const permissionLabel = availablePermissions.find(p => p.code === permission)?.label || permission
                        return (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permissionLabel}
                          </Badge>
                        )
                      })}
                      {profile.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.permissions.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cliente Profiles Section (only for franchisees) */}
      {clientProfiles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Perfis de Clientes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientProfiles.map((profile) => (
              <Card key={profile.id} className="relative border-muted-foreground/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{profile.nome}</CardTitle>
                      <Badge variant="outline">
                        <Users className="mr-1 h-3 w-3" />
                        Cliente
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Somente leitura
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {profile.descricao}
                    </p>
                  )}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Permissões ({profile.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.permissions.slice(0, 3).map((permission) => {
                        const clientePermissions = AVAILABLE_PERMISSIONS['cliente'] || []
                        const permissionLabel = clientePermissions.find(p => p.code === permission)?.label || permission
                        return (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permissionLabel}
                          </Badge>
                        )
                      })}
                      {profile.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.permissions.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {myProfiles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum perfil encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie perfis de funcionários para facilitar o gerenciamento de permissões
            </p>
            <Button onClick={handleCreateProfile}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Perfil
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
