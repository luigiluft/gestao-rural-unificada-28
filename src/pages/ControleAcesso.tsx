import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAllPagePermissions, useUpdatePagePermissions, PagePermission } from "@/hooks/usePagePermissions"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, X, Eye, EyeOff, Save, Shield } from "lucide-react"

const pageInfo = {
  dashboard: { name: "Dashboard", description: "Painel principal com métricas e resumos" },
  catalogo: { name: "Catálogo", description: "Gerenciamento de produtos e catálogo" },
  entradas: { name: "Entradas", description: "Registro de entradas de estoque" },
  recebimento: { name: "Recebimento", description: "Aprovação de entradas de mercadorias" },
  "ondas-alocacao": { name: "Alocações", description: "Gerenciamento de ondas de alocação" },
  estoque: { name: "Estoque", description: "Visualização e controle do estoque" },
  inventario: { name: "Inventário", description: "Conferência e controle de inventário" },
  separacao: { name: "Separação", description: "Separação de itens para expedição" },
  saidas: { name: "Saídas", description: "Gerenciamento de saídas de produtos" },
  expedicao: { name: "Expedição", description: "Aprovação de saídas e expedições" },
  rastreio: { name: "Rastreio", description: "Acompanhamento de entregas e movimentações" },
  relatorios: { name: "Relatórios", description: "Geração e visualização de relatórios" },
  usuarios: { name: "Usuários", description: "Gerenciamento de usuários do sistema" },
  franquias: { name: "Franquias", description: "Gestão de franquias e depósitos" },
  franqueados: { name: "Franqueados", description: "Gerenciamento de franqueados" },
  produtores: { name: "Produtores", description: "Gestão de produtores rurais" },
  fazendas: { name: "Fazendas", description: "Cadastro e gestão de propriedades rurais" },
  subcontas: { name: "Subcontas", description: "Gerenciamento de contas secundárias" },
  suporte: { name: "Suporte", description: "Central de atendimento e tickets" },
  perfil: { name: "Perfil", description: "Configurações do perfil do usuário" },
  configuracoes: { name: "Configurações", description: "Configurações gerais do sistema" },
  "controle-acesso": { name: "Controle de Acesso", description: "Gerenciamento de permissões por página" }
}

const roles = ["admin", "franqueado", "produtor"] as const

export default function ControleAcesso() {
  const { data: permissions = [], isLoading } = useAllPagePermissions()
  const updatePermissions = useUpdatePagePermissions()
  const queryClient = useQueryClient()
  
  const [changes, setChanges] = useState<Record<string, PagePermission>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const getPermissionKey = (pageKey: string, role: string) => `${pageKey}-${role}`
  
  const getPermission = (pageKey: string, role: "admin" | "franqueado" | "produtor") => {
    const key = getPermissionKey(pageKey, role)
    if (changes[key]) return changes[key]
    
    return permissions.find(p => p.page_key === pageKey && p.role === role) || {
      page_key: pageKey,
      role,
      can_access: false,
      visible_in_menu: false
    }
  }

  const updatePermission = (pageKey: string, role: "admin" | "franqueado" | "produtor", field: "can_access" | "visible_in_menu", value: boolean) => {
    const key = getPermissionKey(pageKey, role)
    const current = getPermission(pageKey, role)
    
    setChanges(prev => ({
      ...prev,
      [key]: {
        ...current,
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const saveChanges = async () => {
    try {
      const updates = Object.values(changes)
      await updatePermissions(updates)
      
      await queryClient.invalidateQueries({ queryKey: ["all-page-permissions"] })
      await queryClient.invalidateQueries({ queryKey: ["page-permissions"] })
      
      setChanges({})
      setHasChanges(false)
      toast.success("Permissões atualizadas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar permissões:", error)
      toast.error("Erro ao salvar permissões")
    }
  }

  const resetChanges = () => {
    setChanges({})
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Carregando permissões...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Controle de Acesso
          </h1>
          <p className="text-muted-foreground">
            Gerencie quais páginas cada tipo de usuário pode acessar e visualizar no menu
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetChanges}>
              Cancelar
            </Button>
            <Button onClick={saveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
          <TabsTrigger value="by-role">Por Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões por Página</CardTitle>
              <CardDescription>
                Configure o acesso e visibilidade de cada página para cada perfil de usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Página</TableHead>
                      <TableHead className="w-[300px]">Descrição</TableHead>
                      {roles.map(role => (
                        <TableHead key={role} className="text-center min-w-[120px]">
                          <Badge variant={role === "admin" ? "default" : role === "franqueado" ? "secondary" : "outline"}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(pageInfo).map(([pageKey, info]) => (
                      <TableRow key={pageKey}>
                        <TableCell className="font-medium">{info.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{info.description}</TableCell>
                        {roles.map(role => {
                          const perm = getPermission(pageKey, role)
                          return (
                            <TableCell key={role} className="text-center">
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={perm.can_access}
                              onCheckedChange={(checked) => updatePermission(pageKey, role, "can_access", checked)}
                            />
                                  {perm.can_access ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={perm.visible_in_menu}
                              onCheckedChange={(checked) => updatePermission(pageKey, role, "visible_in_menu", checked)}
                              disabled={!perm.can_access}
                            />
                                  {perm.visible_in_menu ? (
                                    <Eye className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Pode Acessar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>Visível no Menu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-role" className="space-y-4">
          {roles.map(role => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={role === "admin" ? "default" : role === "franqueado" ? "secondary" : "outline"}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                  - Páginas Acessíveis
                </CardTitle>
                <CardDescription>
                  Páginas que usuários do tipo {role} podem acessar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.entries(pageInfo).map(([pageKey, info]) => {
                    const perm = getPermission(pageKey, role)
                    return (
                      <div key={pageKey} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{info.name}</div>
                          <div className="text-sm text-muted-foreground">{info.description}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Acessar:</span>
                            <Switch
                              checked={perm.can_access}
                              onCheckedChange={(checked) => updatePermission(pageKey, role, "can_access", checked)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Menu:</span>
                            <Switch
                              checked={perm.visible_in_menu}
                              onCheckedChange={(checked) => updatePermission(pageKey, role, "visible_in_menu", checked)}
                              disabled={!perm.can_access}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}