import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserPlus, Settings, Users, Trash2 } from "lucide-react"
import { useProfile } from "@/hooks/useProfile"
import { useEmployeeProfiles } from "@/hooks/useEmployeeProfiles"
import { useUserEmployeeProfiles } from "@/hooks/useUserEmployeeProfiles"
import { useCleanupPermissions } from "@/hooks/useCleanupPermissions"
import { EmptyState } from "@/components/ui/empty-state"
import { EmployeeProfile } from "@/types/permissions"

interface SubaccountProfile {
  user_id: string
  nome: string | null
  email: string | null
  employee_profile?: EmployeeProfile
}

export default function Subcontas() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  
  // Estados para o formulário de convite
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedProfileId, setSelectedProfileId] = useState("")
  const [inviteFranquia, setInviteFranquia] = useState("")
  
  // Estados para gerenciar perfil de subconta
  const [profileManageOpen, setProfileManageOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUserName, setSelectedUserName] = useState<string>("")
  
  // Hooks para perfis de funcionários
  const { profiles, isLoading: isLoadingProfiles } = useEmployeeProfiles(profile?.role)
  const { assignProfile, removeProfile } = useUserEmployeeProfiles()
  const { cleanupSubaccountPermissions } = useCleanupPermissions()

  // Buscar subcontas do usuário
  const { data: subaccounts = [], refetch: refetchSubaccounts, isLoading: loadingSubaccounts } = useQuery({
    queryKey: ["subaccounts-simplified", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SubaccountProfile[]> => {
      const { data, error } = await supabase
        .from("user_hierarchy")
        .select(`
          child_user_id,
          profiles!inner(user_id, nome, email)
        `)
        .eq("parent_user_id", user!.id)

      if (error) throw error

      const subaccountProfiles = (data ?? []).map((item: any) => ({
        user_id: item.profiles.user_id,
        nome: item.profiles.nome,
        email: item.profiles.email,
      }))

      // Buscar perfis de funcionário para cada subconta
      const { data: profileAssignments } = await supabase
        .from("user_employee_profiles")
        .select(`
          user_id,
          employee_profiles(*)
        `)
        .in("user_id", subaccountProfiles.map(s => s.user_id))

      // Combinar dados
      return subaccountProfiles.map(subaccount => ({
        ...subaccount,
        employee_profile: profileAssignments?.find(
          (pa: any) => pa.user_id === subaccount.user_id
        )?.employee_profiles || undefined
      }))
    },
  })

  // Buscar franquias para admin criando produtor
  const { data: franquias = [] } = useQuery({
    queryKey: ["franquias-for-subaccounts"],
    enabled: profile?.role === 'admin',
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select(`
          id,
          nome,
          master_franqueado_id,
          profiles!franquias_master_franqueado_id_fkey(nome, email)
        `)
        .eq("ativo", true)

      if (error) throw error
      return data || []
    },
  })

  // Mutação para enviar convite
  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail || !selectedProfileId) {
        throw new Error("Email e perfil são obrigatórios")
      }

      const selectedProfile = profiles?.find(p => p.id === selectedProfileId)
      if (!selectedProfile) {
        throw new Error("Perfil selecionado não encontrado")
      }

      // Determinar parent_user_id e franquia_id baseado no role
      let parentUserId = user?.id
      let franquiaId = null

      if (profile?.role === 'admin' && selectedProfile.role === 'produtor') {
        if (!inviteFranquia) {
          throw new Error("Selecione uma franquia para o produtor")
        }
        const selectedFranquiaData = franquias.find(f => f.id === inviteFranquia)
        if (selectedFranquiaData) {
          parentUserId = selectedFranquiaData.master_franqueado_id
          franquiaId = inviteFranquia
        }
      }

      const inviteData = {
        email: inviteEmail,
        inviter_user_id: user?.id,
        parent_user_id: parentUserId,
        role: selectedProfile.role,
        permissions: selectedProfile.permissions,
        ...(franquiaId && { franquia_id: franquiaId })
      }

      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: inviteData
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar convite')

      return data
    },
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!")
      setInviteOpen(false)
      setInviteEmail("")
      setSelectedProfileId("")
      setInviteFranquia("")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`)
    }
  })

  // Mutação para desvincular subconta
  const unlinkMutation = useMutation({
    mutationFn: async (subaccountId: string) => {
      const { error } = await supabase
        .from("user_hierarchy")
        .delete()
        .eq("parent_user_id", user?.id)
        .eq("child_user_id", subaccountId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Subconta desvinculada com sucesso!")
      refetchSubaccounts()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desvincular: ${error.message}`)
    }
  })

  const handleAssignProfile = (profileId: string) => {
    assignProfile({ userId: selectedUserId, profileId })
    setProfileManageOpen(false)
    refetchSubaccounts()
  }

  const handleRemoveProfile = () => {
    removeProfile(selectedUserId)
    setProfileManageOpen(false)
    refetchSubaccounts()
  }

  if (!profile?.role) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subcontas</h1>
          <p className="text-muted-foreground">
            Gerencie as subcontas dos seus funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => cleanupSubaccountPermissions()}
            size="sm"
          >
            Migrar Sistema
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Subconta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Subconta</DialogTitle>
                <DialogDescription>
                  Selecione um perfil de funcionário e envie um convite por email
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="funcionario@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile">Perfil de Funcionário</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.nome} ({profile.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {profile.role === 'admin' && selectedProfileId && profiles?.find(p => p.id === selectedProfileId)?.role === 'produtor' && (
                  <div className="grid gap-2">
                    <Label htmlFor="franquia">Franquia</Label>
                    <Select value={inviteFranquia} onValueChange={setInviteFranquia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma franquia" />
                      </SelectTrigger>
                      <SelectContent>
                        {franquias.map((franquia: any) => (
                          <SelectItem key={franquia.id} value={franquia.id}>
                            {franquia.nome} - {franquia.profiles?.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => sendInviteMutation.mutate()}
                  disabled={sendInviteMutation.isPending}
                >
                  {sendInviteMutation.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subcontas Ativas
          </CardTitle>
          <CardDescription>
            Lista de funcionários vinculados à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSubaccounts ? (
            <div className="text-center py-4">Carregando...</div>
          ) : subaccounts.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Nenhuma subconta encontrada"
              description="Crie sua primeira subconta clicando no botão acima"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subaccounts.map((subaccount) => (
                  <TableRow key={subaccount.user_id}>
                    <TableCell className="font-medium">
                      {subaccount.nome || "Sem nome"}
                    </TableCell>
                    <TableCell>{subaccount.email}</TableCell>
                    <TableCell>
                      {subaccount.employee_profile ? (
                        <Badge variant="secondary">
                          {subaccount.employee_profile.nome}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem perfil</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(subaccount.user_id)
                            setSelectedUserName(subaccount.nome || subaccount.email || "")
                            setProfileManageOpen(true)
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkMutation.mutate(subaccount.user_id)}
                          disabled={unlinkMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para gerenciar perfil */}
      <Dialog open={profileManageOpen} onOpenChange={setProfileManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Perfil</DialogTitle>
            <DialogDescription>
              Alterar o perfil de funcionário para {selectedUserName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Novo Perfil</Label>
              <Select onValueChange={handleAssignProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.nome} ({profile.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleRemoveProfile}>
              Remover Perfil
            </Button>
            <Button variant="outline" onClick={() => setProfileManageOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}