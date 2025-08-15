import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useDepositosDisponiveis } from "@/hooks/useDepositosDisponiveis"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useProdutores } from "@/hooks/useProfile"

export function GerenciarDepositosProdutor() {
  const { user } = useAuth()
  const { data: depositosDisponiveis } = useDepositosDisponiveis(user?.id)
  const { data: produtores } = useProdutores()
  const [selectedProdutor, setSelectedProdutor] = useState<string>("")
  const [selectedDeposito, setSelectedDeposito] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: relacionamentos = [] } = useQuery({
    queryKey: ["user-hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_hierarchy")
        .select(`
          id,
          parent_user_id,
          child_user_id,
          created_at
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Get profile data for all users
      const userIds = [...new Set([
        ...data.map(rel => rel.parent_user_id),
        ...data.map(rel => rel.child_user_id)
      ])]
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, email, role")
        .in("user_id", userIds)
      
      // Combine data
      return data.map(rel => ({
        ...rel,
        parent: profiles?.find(p => p.user_id === rel.parent_user_id),
        child: profiles?.find(p => p.user_id === rel.child_user_id)
      }))
    },
  })

  const handleAddRelacionamento = async () => {
    if (!selectedProdutor || !selectedDeposito) {
      toast.error("Selecione um produtor e um franqueado")
      return
    }

    try {
      const { error } = await supabase
        .from("user_hierarchy")
        .insert({
          parent_user_id: selectedDeposito,
          child_user_id: selectedProdutor,
        })

      if (error) throw error

      toast.success("Relacionamento adicionado com sucesso")
      setIsDialogOpen(false)
      setSelectedProdutor("")
      setSelectedDeposito("")
      queryClient.invalidateQueries({ queryKey: ["user-hierarchy"] })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveRelacionamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_hierarchy")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Relacionamento removido com sucesso")
      queryClient.invalidateQueries({ queryKey: ["user-hierarchy"] })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Relacionamentos Produtor-Franqueado</CardTitle>
        <CardDescription>
          Gerencie quais produtores têm acesso às franquias de cada franqueado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Relacionamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Relacionamento</DialogTitle>
              <DialogDescription>
                Vincule um produtor a um franqueado para dar acesso às suas franquias
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="produtor">Produtor</Label>
                <Select value={selectedProdutor} onValueChange={setSelectedProdutor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtores?.map((produtor) => (
                      <SelectItem key={produtor.user_id} value={produtor.user_id}>
                        {produtor.nome} - {produtor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="franqueado">Franqueado</Label>
                <Select value={selectedDeposito} onValueChange={setSelectedDeposito}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um franqueado" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositosDisponiveis?.map((item) => (
                      <SelectItem key={item.franqueado_id} value={item.franqueado_id}>
                        {item.franqueado_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddRelacionamento} className="w-full">
                Adicionar Relacionamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produtor</TableHead>
              <TableHead>Franqueado</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relacionamentos.map((rel) => (
              <TableRow key={rel.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{rel.child?.nome}</div>
                    <div className="text-sm text-muted-foreground">{rel.child?.email}</div>
                    <Badge variant="outline" className="mt-1">
                      {rel.child?.role}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{rel.parent?.nome}</div>
                    <div className="text-sm text-muted-foreground">{rel.parent?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(rel.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveRelacionamento(rel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {relacionamentos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum relacionamento encontrado. Adicione relacionamentos para que os produtores tenham acesso às franquias.
          </div>
        )}
      </CardContent>
    </Card>
  )
}