import { useState } from "react"
import { Plus, Search, Edit, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMotoristas, useCreateMotorista, useUpdateMotorista, useDeleteMotorista } from "@/hooks/useMotoristas"
import { LoadingState } from "@/components/ui/loading-state"
import { EmptyState } from "@/components/ui/empty-state"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const motoristaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  cnh: z.string().min(1, "CNH é obrigatória"),
  categoria_cnh: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  data_vencimento_cnh: z.string().optional(),
  ativo: z.boolean().optional(),
})

type MotoristaFormData = z.infer<typeof motoristaSchema>

export default function Motoristas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMotorista, setEditingMotorista] = useState<any>(null)

  const { data: motoristas, isLoading, error } = useMotoristas()
  const createMotorista = useCreateMotorista()
  const updateMotorista = useUpdateMotorista()
  const deleteMotorista = useDeleteMotorista()

  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      cnh: "",
      categoria_cnh: "",
      telefone: "",
      email: "",
      ativo: true,
    },
  })

  const filteredMotoristas = motoristas?.filter((motorista) =>
    motorista.cnh.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motorista.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motorista.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onSubmit = async (data: MotoristaFormData) => {
    try {
      const submitData = {
        nome: data.nome,
        cpf: data.cpf,
        cnh: data.cnh,
        categoria_cnh: data.categoria_cnh || undefined,
        telefone: data.telefone || undefined,
        email: data.email || undefined,
        data_vencimento_cnh: data.data_vencimento_cnh || undefined,
        ...(editingMotorista && { ativo: data.ativo }),
      }
      
      if (editingMotorista) {
        await updateMotorista.mutateAsync({ id: editingMotorista.id, ...submitData })
      } else {
        await createMotorista.mutateAsync(submitData)
      }
      setDialogOpen(false)
      setEditingMotorista(null)
      form.reset()
    } catch (error) {
      console.error("Erro ao salvar motorista:", error)
    }
  }

  const handleEdit = (motorista: any) => {
    setEditingMotorista(motorista)
    form.reset({
      nome: motorista.nome,
      cpf: motorista.cpf,
      cnh: motorista.cnh,
      categoria_cnh: motorista.categoria_cnh || "",
      telefone: motorista.telefone || "",
      email: motorista.email || "",
      data_vencimento_cnh: motorista.data_vencimento_cnh,
      ativo: motorista.ativo,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este motorista?")) {
      await deleteMotorista.mutateAsync(id)
    }
  }

  const handleOpenDialog = () => {
    setEditingMotorista(null)
    form.reset()
    setDialogOpen(true)
  }

  const isVencimentoProximo = (dataVencimento: string) => {
    if (!dataVencimento) return false
    const vencimento = new Date(dataVencimento)
    const hoje = new Date()
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diasRestantes <= 30 && diasRestantes >= 0
  }

  const isVencido = (dataVencimento: string) => {
    if (!dataVencimento) return false
    const vencimento = new Date(dataVencimento)
    const hoje = new Date()
    return vencimento < hoje
  }

  if (isLoading) return <LoadingState />
  if (error) return <div>Erro ao carregar motoristas</div>

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Motorista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMotorista ? "Editar Motorista" : "Novo Motorista"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="123.456.789-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNH</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678901" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoria_cnh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria CNH</FormLabel>
                        <FormControl>
                          <Input placeholder="B, C, D, E" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="data_vencimento_cnh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento da CNH</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editingMotorista && (
                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Ativo</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMotorista.isPending || updateMotorista.isPending}>
                    {editingMotorista ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por CNH, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMotoristas?.length === 0 ? (
        <EmptyState
          icon="User"
          title="Nenhum motorista encontrado"
          description="Cadastre o primeiro motorista"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMotoristas?.map((motorista) => (
            <Card key={motorista.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  {motorista.nome || "Nome não informado"}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={motorista.ativo ? "default" : "secondary"}>
                    {motorista.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  {motorista.data_vencimento_cnh && (
                    <>
                      {isVencido(motorista.data_vencimento_cnh) && (
                        <Badge variant="destructive">CNH Vencida</Badge>
                      )}
                      {isVencimentoProximo(motorista.data_vencimento_cnh) && !isVencido(motorista.data_vencimento_cnh) && (
                        <Badge variant="secondary">CNH a Vencer</Badge>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(motorista)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(motorista.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">CNH:</span>
                    <p className="font-medium">{motorista.cnh}</p>
                  </div>
                  {motorista.email && (
                    <div>
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <p className="font-medium">{motorista.email}</p>
                    </div>
                  )}
                  {motorista.telefone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <p className="font-medium">{motorista.telefone}</p>
                    </div>
                  )}
                  {motorista.categoria_cnh && (
                    <div>
                      <span className="text-sm text-muted-foreground">Categoria:</span>
                      <p className="font-medium">{motorista.categoria_cnh}</p>
                    </div>
                  )}
                  {motorista.data_vencimento_cnh && (
                    <div>
                      <span className="text-sm text-muted-foreground">Vencimento CNH:</span>
                      <p className="font-medium">
                        {format(new Date(motorista.data_vencimento_cnh), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Cadastrado em:</span>
                    <p className="font-medium">
                      {format(new Date(motorista.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}