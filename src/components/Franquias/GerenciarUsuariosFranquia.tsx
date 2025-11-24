import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Users, Trash2, UserCheck, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useFranquiaUsuarios, useAddFranquiaUsuario, useRemoveFranquiaUsuario } from "@/hooks/useFranquiaUsuarios"
import { useBulkAddFranquiaUsuario } from "@/hooks/useBulkFranquiaUsuarios"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useProfile } from "@/hooks/useProfile"
import { useFranquias } from "@/hooks/useFranquias"
import { getRoleLabel } from "@/utils/roleTranslations"

interface GerenciarUsuariosFranquiaProps {
  franquiaId?: string
  massModeEnabled?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const GerenciarUsuariosFranquia = ({ 
  franquiaId, 
  massModeEnabled = false,
  open,
  onOpenChange
}: GerenciarUsuariosFranquiaProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedPapel, setSelectedPapel] = useState<'master' | 'operador'>('operador')
  const [selectedFranquias, setSelectedFranquias] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const { data: profile } = useProfile()
  const { data: franquiaUsuarios, isLoading } = useFranquiaUsuarios(franquiaId)
  const { data: allFranquias } = useFranquias()
  const { data: availableUsers, isLoading: isLoadingUsers } = useAvailableUsers()
  
  const addUsuario = useAddFranquiaUsuario()
  const removeUsuario = useRemoveFranquiaUsuario()
  const bulkAddUsuario = useBulkAddFranquiaUsuario()

  // Filtrar usuários que já NÃO estão associados à franquia atual
  const availableUsersForAdd = useMemo(() => {
    if (!availableUsers) return []
    
    if (massModeEnabled) {
      // No modo massa, mostrar todos os usuários franqueado
      return availableUsers
    }
    
    // No modo individual, filtrar usuários já associados
    const associatedUserIds = franquiaUsuarios?.map(fu => fu.user_id) || []
    return availableUsers.filter(u => !associatedUserIds.includes(u.user_id))
  }, [availableUsers, franquiaUsuarios, massModeEnabled])

  // Filtrar franquias disponíveis (excluindo aquelas onde o usuário já está)
  const availableFranquiasForUser = useMemo(() => {
    if (!selectedUserId || !allFranquias) return []
    
    // Buscar todas as franquias onde o usuário já está associado
    // Por enquanto, mostrar todas as franquias disponíveis
    return allFranquias.filter(f => f.ativo)
  }, [selectedUserId, allFranquias])

  const filteredUsuarios = useMemo(() => {
    if (!franquiaUsuarios) return []
    if (!searchTerm) return franquiaUsuarios
    
    const term = searchTerm.toLowerCase()
    return franquiaUsuarios.filter(fu => 
      fu.profiles?.nome?.toLowerCase().includes(term) ||
      fu.profiles?.email?.toLowerCase().includes(term)
    )
  }, [franquiaUsuarios, searchTerm])

  const handleToggleFranquia = (franquiaId: string) => {
    setSelectedFranquias(prev => 
      prev.includes(franquiaId)
        ? prev.filter(id => id !== franquiaId)
        : [...prev, franquiaId]
    )
  }

  const handleSelectAllFranquias = () => {
    if (selectedFranquias.length === availableFranquiasForUser.length) {
      setSelectedFranquias([])
    } else {
      setSelectedFranquias(availableFranquiasForUser.map(f => f.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId) {
      toast.error("Selecione um usuário")
      return
    }

    if (massModeEnabled) {
      // Modo massa: associar a múltiplas franquias
      if (selectedFranquias.length === 0) {
        toast.error("Selecione ao menos uma franquia")
        return
      }

      bulkAddUsuario.mutate({
        userId: selectedUserId,
        franquiaIds: selectedFranquias,
        papel: selectedPapel
      }, {
        onSuccess: () => {
          resetForm()
          setIsAddDialogOpen(false)
        }
      })
    } else {
      // Modo individual: associar a uma franquia específica
      if (!franquiaId) {
        toast.error("ID da franquia não especificado")
        return
      }

      addUsuario.mutate({
        franquiaId,
        userId: selectedUserId,
        papel: selectedPapel
      }, {
        onSuccess: () => {
          resetForm()
          setIsAddDialogOpen(false)
        }
      })
    }
  }

  const resetForm = () => {
    setSelectedUserId("")
    setSelectedPapel('operador')
    setSelectedFranquias([])
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente remover este usuário da franquia?")) {
      removeUsuario.mutate(id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {massModeEnabled 
              ? "Gerenciar Usuários em Massa" 
              : "Gerenciar Usuários da Franquia"
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão adicionar + busca */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {massModeEnabled 
                      ? "Associar Usuário a Múltiplas Franquias"
                      : "Adicionar Usuário à Franquia"
                    }
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuário *</Label>
                      <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                        required
                      >
                        <SelectTrigger id="usuario">
                          <SelectValue placeholder="Selecione o usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsersForAdd.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.nome} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableUsersForAdd.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          {massModeEnabled 
                            ? "Nenhum usuário operador disponível"
                            : "Todos os usuários já estão associados a esta franquia"
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="papel">Papel *</Label>
                      <Select
                        value={selectedPapel}
                        onValueChange={(v: 'master' | 'operador') => setSelectedPapel(v)}
                        required
                      >
                        <SelectTrigger id="papel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operador">Operador</SelectItem>
                          <SelectItem value="master">Master</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {massModeEnabled && selectedUserId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Franquias * (selecione múltiplas)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllFranquias}
                        >
                          {selectedFranquias.length === availableFranquiasForUser.length
                            ? "Desmarcar Todas"
                            : "Selecionar Todas"
                          }
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                        {availableFranquiasForUser.map((franquia) => (
                          <div key={franquia.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`franquia-${franquia.id}`}
                              checked={selectedFranquias.includes(franquia.id)}
                              onCheckedChange={() => handleToggleFranquia(franquia.id)}
                            />
                            <Label
                              htmlFor={`franquia-${franquia.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              {franquia.nome}
                            </Label>
                            <Badge variant="outline">
                              {franquia.tipo_deposito === 'franquia' ? 'Franquia' : 'Filial'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedFranquias.length} {selectedFranquias.length === 1 ? 'franquia selecionada' : 'franquias selecionadas'}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        resetForm()
                        setIsAddDialogOpen(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={
                        addUsuario.isPending || 
                        bulkAddUsuario.isPending ||
                        !selectedUserId ||
                        (massModeEnabled && selectedFranquias.length === 0)
                      }
                    >
                      {addUsuario.isPending || bulkAddUsuario.isPending 
                        ? "Associando..." 
                        : massModeEnabled
                          ? `Associar a ${selectedFranquias.length} ${selectedFranquias.length === 1 ? 'Franquia' : 'Franquias'}`
                          : "Adicionar"
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de usuários associados - apenas no modo individual */}
          {!massModeEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usuários Associados</CardTitle>
                <CardDescription>
                  Lista de usuários com acesso a esta franquia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-4">Carregando...</p>
                ) : filteredUsuarios.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsuarios.map((fu) => (
                        <TableRow key={fu.id}>
                          <TableCell className="font-medium">
                            {fu.profiles?.nome || "Sem nome"}
                          </TableCell>
                          <TableCell>{fu.profiles?.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={fu.papel === 'master' ? 'default' : 'secondary'}>
                              {fu.papel === 'master' ? 'Master' : 'Operador'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fu.ativo ? 'default' : 'outline'}>
                              {fu.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(fu.id)}
                              disabled={removeUsuario.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                    <p className="text-sm">
                      {searchTerm 
                        ? "Tente ajustar os termos de busca"
                        : "Clique em 'Adicionar Usuário' para começar"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mensagem informativa para modo massa */}
          {massModeEnabled && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Modo de Gestão em Massa</p>
                    <p className="text-sm text-muted-foreground">
                      Neste modo, você pode selecionar um usuário e associá-lo a múltiplas franquias de uma só vez.
                      Clique em "Adicionar Usuário" para começar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
