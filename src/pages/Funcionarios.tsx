import { useState } from "react"
import { TablePageLayout } from "@/components/ui/table-page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, Trash2, Users } from "lucide-react"
import { useFolhaPagamento, useFolhaPagamentoMutations, useTotalFolhaPagamento } from "@/hooks/useFolhaPagamento"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useFranquias } from "@/hooks/useFranquias"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const folhaSchema = z.object({
  user_id: z.string().min(1, "Selecione um funcionário"),
  deposito_id: z.string().min(1, "Selecione um depósito"),
  salario_mensal: z.string().min(1, "Informe o salário"),
  cargo: z.string().optional(),
  data_inicio: z.string().min(1, "Informe a data de início"),
  observacoes: z.string().optional()
})

type FolhaFormData = z.infer<typeof folhaSchema>

export default function Funcionarios() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const { data: folhas = [], isLoading } = useFolhaPagamento()
  const { data: totalFolha } = useTotalFolhaPagamento()
  const { data: usuarios = [] } = useAvailableUsers()
  const { data: depositos = [] } = useFranquias()
  const { createFolha, updateFolha, deleteFolha } = useFolhaPagamentoMutations()
  
  const form = useForm<FolhaFormData>({
    resolver: zodResolver(folhaSchema),
    defaultValues: {
      user_id: "",
      deposito_id: "",
      salario_mensal: "",
      cargo: "",
      data_inicio: new Date().toISOString().split('T')[0],
      observacoes: ""
    }
  })
  
  const onSubmit = (data: FolhaFormData) => {
    const folhaData = {
      ...data,
      salario_mensal: parseFloat(data.salario_mensal),
      ativo: true
    }
    
    if (editingId) {
      updateFolha.mutate({ id: editingId, ...folhaData }, {
        onSuccess: () => {
          setIsDialogOpen(false)
          setEditingId(null)
          form.reset()
        }
      })
    } else {
      createFolha.mutate(folhaData as any, {
        onSuccess: () => {
          setIsDialogOpen(false)
          form.reset()
        }
      })
    }
  }
  
  const handleEdit = (folha: any) => {
    setEditingId(folha.id)
    form.reset({
      user_id: folha.user_id,
      deposito_id: folha.deposito_id,
      salario_mensal: folha.salario_mensal.toString(),
      cargo: folha.cargo || "",
      data_inicio: folha.data_inicio,
      observacoes: folha.observacoes || ""
    })
    setIsDialogOpen(true)
  }
  
  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente inativar este funcionário?")) {
      deleteFolha.mutate(id)
    }
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }
  
  return (
    <TablePageLayout
      title="Folha de Pagamento"
      description="Gestão de folha de pagamento por depósito"
      tableContent={
        <div className="p-6 space-y-6">
          {/* Card de Resumo */}
          <div className="flex justify-between items-center">
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total da Folha
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalFolha || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Total mensal de salários
                </p>
              </CardContent>
            </Card>
            
            <div className="ml-4">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  setEditingId(null)
                  form.reset()
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Funcionário
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Funcionário" : "Adicionar Funcionário"}
              </DialogTitle>
              <DialogDescription>
                Configure o salário do funcionário no depósito
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usuarios.map((usuario) => (
                            <SelectItem key={usuario.user_id} value={usuario.user_id}>
                              {usuario.nome} ({usuario.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deposito_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depósito</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o depósito" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {depositos.map((deposito) => (
                            <SelectItem key={deposito.id} value={deposito.id}>
                              {deposito.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Operador de Armazém" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salario_mensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salário Mensal</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createFolha.isPending || updateFolha.isPending}
                  >
                    {editingId ? "Atualizar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
          
          {/* Tabela de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle>Funcionários</CardTitle>
              <CardDescription>
                Listagem de funcionários e salários por depósito
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Carregando...
                </div>
              ) : folhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhum funcionário cadastrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead className="text-right">Salário Mensal</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {folhas.map((folha) => (
                      <TableRow key={folha.id}>
                        <TableCell className="font-medium">{folha.profiles?.nome}</TableCell>
                        <TableCell>{folha.profiles?.email}</TableCell>
                        <TableCell>{folha.cargo || "-"}</TableCell>
                        <TableCell>{folha.franquias?.nome}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(folha.salario_mensal)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(folha.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={folha.ativo ? "default" : "secondary"}>
                            {folha.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(folha)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(folha.id)}
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
        </div>
      }
    />
  )
}
