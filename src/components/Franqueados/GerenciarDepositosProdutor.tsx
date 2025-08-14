import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useDepositosFranqueado, useRelacionamentosProdutorFranqueado } from "@/hooks/useDepositosDisponiveis"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export function GerenciarDepositosProdutor() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProdutor, setSelectedProdutor] = useState("")
  const [selectedDeposito, setSelectedDeposito] = useState("")
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: depositos } = useDepositosFranqueado()
  const { data: relacionamentos, refetch } = useRelacionamentosProdutorFranqueado()

  // Query para buscar produtores da hierarquia
  const { data: produtores } = useQuery({
    queryKey: ["produtores-hierarquia", user?.id],
    queryFn: async () => {
      // First get the hierarchy
      const { data: hierarchy, error: hierarchyError } = await supabase
        .from("user_hierarchy")
        .select("child_user_id")
        .eq("parent_user_id", user?.id || '')

      if (hierarchyError) throw hierarchyError
      
      const childIds = hierarchy?.map(h => h.child_user_id) || []
      
      if (childIds.length === 0) return []

      // Then get the profiles for those children who are producers
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, role")
        .eq("role", "produtor")
        .in("user_id", childIds)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const handleConcederAcesso = async () => {
    if (!selectedProdutor || !selectedDeposito) {
      toast.error("Selecione um produtor e um depósito")
      return
    }

    try {
      const { error } = await supabase
        .from("produtor_franqueado_depositos")
        .insert({
          produtor_id: selectedProdutor,
          franqueado_id: user?.id,
          deposito_id: selectedDeposito,
        })

      if (error) throw error

      toast.success("Acesso concedido com sucesso!")
      setIsDialogOpen(false)
      setSelectedProdutor("")
      setSelectedDeposito("")
      refetch()
      queryClient.invalidateQueries({ queryKey: ["depositos-disponiveis"] })
    } catch (error) {
      console.error("Erro ao conceder acesso:", error)
      toast.error("Erro ao conceder acesso")
    }
  }

  const handleRevogarAcesso = async (relacionamentoId: string) => {
    try {
      const { error } = await supabase
        .from("produtor_franqueado_depositos")
        .update({ ativo: false })
        .eq("id", relacionamentoId)

      if (error) throw error

      toast.success("Acesso revogado com sucesso!")
      refetch()
      queryClient.invalidateQueries({ queryKey: ["depositos-disponiveis"] })
    } catch (error) {
      console.error("Erro ao revogar acesso:", error)
      toast.error("Erro ao revogar acesso")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Acesso aos Depósitos</CardTitle>
        <CardDescription>
          Controle quais produtores podem armazenar produtos em seus depósitos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Autorizações Ativas</h3>
            <p className="text-sm text-muted-foreground">
              Produtores com acesso aos seus depósitos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Conceder Acesso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conceder Acesso ao Depósito</DialogTitle>
                <DialogDescription>
                  Selecione um produtor e um depósito para conceder acesso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="produtor">Produtor</Label>
                  <Select value={selectedProdutor} onValueChange={setSelectedProdutor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produtor" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtores?.map((item) => (
                        <SelectItem key={item.user_id} value={item.user_id}>
                          <div className="flex flex-col">
                            <span>{item.nome}</span>
                            <span className="text-sm text-muted-foreground">
                              {item.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposito">Depósito</Label>
                  <Select value={selectedDeposito} onValueChange={setSelectedDeposito}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      {depositos?.map((deposito) => (
                        <SelectItem key={deposito.id} value={deposito.id}>
                          {deposito.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConcederAcesso}>
                    Conceder Acesso
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produtor</TableHead>
              <TableHead>Depósito</TableHead>
              <TableHead>Data de Autorização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relacionamentos?.map((rel) => (
              <TableRow key={rel.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{rel.produtor?.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {rel.produtor?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{rel.depositos?.nome}</TableCell>
                <TableCell>
                  {new Date(rel.data_autorizacao).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant={rel.ativo ? "default" : "secondary"}>
                    {rel.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rel.ativo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevogarAcesso(rel.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {relacionamentos?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma autorização encontrada
          </div>
        )}
      </CardContent>
    </Card>
  )
}