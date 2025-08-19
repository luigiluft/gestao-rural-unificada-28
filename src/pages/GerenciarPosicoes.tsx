import { useState } from "react"
import { useStoragePositions, useCreateStoragePosition, useUpdateStoragePosition } from "@/hooks/useStoragePositions"
import { useProfile } from "@/hooks/useProfile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MapPin, Plus, Edit, Archive, Package } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

export default function GerenciarPosicoes() {
  const { data: profile } = useProfile()
  const [selectedDeposito, setSelectedDeposito] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    tipo_posicao: "prateleira",
    capacidade_maxima: ""
  })

  // Fetch user's franquias
  const { data: franquias } = useQuery({
    queryKey: ["user-franquias"],
    queryFn: async () => {
      if (!profile) return []
      
      if (profile.role === 'admin') {
        const { data } = await supabase
          .from("franquias")
          .select("*")
          .eq("ativo", true)
        return data || []
      } else if (profile.role === 'franqueado') {
        const { data } = await supabase
          .from("franquias")
          .select("*")
          .eq("master_franqueado_id", profile.user_id)
          .eq("ativo", true)
        return data || []
      }
      
      return []
    },
    enabled: !!profile
  })

  const { data: positions, isLoading } = useStoragePositions(selectedDeposito)
  const createPosition = useCreateStoragePosition()
  const updatePosition = useUpdateStoragePosition()

  const resetForm = () => {
    setFormData({
      codigo: "",
      descricao: "",
      tipo_posicao: "prateleira",
      capacidade_maxima: ""
    })
    setEditingPosition(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const positionData = {
      ...formData,
      deposito_id: selectedDeposito,
      capacidade_maxima: formData.capacidade_maxima ? Number(formData.capacidade_maxima) : undefined
    }

    if (editingPosition) {
      await updatePosition.mutateAsync({
        id: editingPosition.id,
        updates: positionData
      })
    } else {
      await createPosition.mutateAsync(positionData)
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleEdit = (position: any) => {
    setEditingPosition(position)
    setFormData({
      codigo: position.codigo,
      descricao: position.descricao || "",
      tipo_posicao: position.tipo_posicao || "prateleira",
      capacidade_maxima: position.capacidade_maxima?.toString() || ""
    })
    setDialogOpen(true)
  }

  const handleToggleStatus = async (position: any) => {
    await updatePosition.mutateAsync({
      id: position.id,
      updates: { ativo: !position.ativo }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Posições de Estoque</h1>
        <p className="text-muted-foreground mt-2">
          Configure e gerencie as posições de armazenamento do depósito
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Depósito</CardTitle>
          <CardDescription>
            Escolha o depósito para gerenciar suas posições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDeposito} onValueChange={setSelectedDeposito}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecionar depósito..." />
            </SelectTrigger>
            <SelectContent>
              {franquias?.map((franquia: any) => (
                <SelectItem key={franquia.id} value={franquia.id}>
                  {franquia.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDeposito && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Posições de Estoque
                </CardTitle>
                <CardDescription>
                  {positions?.length || 0} posições configuradas
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Posição
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPosition ? "Editar Posição" : "Nova Posição"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPosition ? "Edite os dados da posição" : "Adicione uma nova posição de estoque"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="codigo">Código da Posição *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        placeholder="Ex: A01-01-01"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descrição da posição..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo_posicao">Tipo de Posição</Label>
                      <Select 
                        value={formData.tipo_posicao} 
                        onValueChange={(value) => setFormData({ ...formData, tipo_posicao: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prateleira">Prateleira</SelectItem>
                          <SelectItem value="pallet">Pallet</SelectItem>
                          <SelectItem value="container">Container</SelectItem>
                          <SelectItem value="gaveta">Gaveta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="capacidade_maxima">Capacidade Máxima (kg)</Label>
                      <Input
                        id="capacidade_maxima"
                        type="number"
                        value={formData.capacidade_maxima}
                        onChange={(e) => setFormData({ ...formData, capacidade_maxima: e.target.value })}
                        placeholder="Capacidade em kg..."
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createPosition.isPending || updatePosition.isPending}
                      >
                        {editingPosition ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !positions || positions.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhuma posição configurada"
                description="Comece criando sua primeira posição de estoque"
                action={
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Posição
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position: any) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.codigo}
                      </TableCell>
                      <TableCell>{position.descricao || '-'}</TableCell>
                      <TableCell className="capitalize">
                        {position.tipo_posicao}
                      </TableCell>
                      <TableCell>
                        {position.capacidade_maxima ? `${position.capacidade_maxima} kg` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {position.ocupado ? (
                            <Badge variant="outline">Ocupado</Badge>
                          ) : (
                            <Badge variant="secondary">Livre</Badge>
                          )}
                          {position.ativo ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(position)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(position)}
                          >
                            <Archive className="w-3 h-3" />
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
      )}
    </div>
  )
}