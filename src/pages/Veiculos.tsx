import { useState } from "react"
import { Plus, Search, Edit, Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useVeiculos, useCreateVeiculo, useUpdateVeiculo, useDeleteVeiculo } from "@/hooks/useVeiculos"
import { LoadingState } from "@/components/ui/loading-state"
import { EmptyState } from "@/components/ui/empty-state"

const veiculoSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória"),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  marca: z.string().min(1, "Marca é obrigatória"),
  ano: z.coerce.number().optional(),
  capacidade_peso: z.coerce.number().optional(),
  capacidade_volume: z.coerce.number().optional(),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  ativo: z.boolean().optional(),
})

type VeiculoFormData = z.infer<typeof veiculoSchema>

export default function Veiculos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState<any>(null)

  const { data: veiculos, isLoading, error } = useVeiculos()
  const createVeiculo = useCreateVeiculo()
  const updateVeiculo = useUpdateVeiculo()
  const deleteVeiculo = useDeleteVeiculo()

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: "",
      modelo: "",
      marca: "",
      tipo: "caminhao",
      ativo: true,
    },
  })

  const filteredVeiculos = veiculos?.filter((veiculo) =>
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onSubmit = async (data: VeiculoFormData) => {
    try {
      const submitData = {
        placa: data.placa,
        modelo: data.modelo,
        marca: data.marca,
        ano: data.ano,
        capacidade_peso: data.capacidade_peso,
        capacidade_volume: data.capacidade_volume,
        tipo: data.tipo,
        ...(editingVeiculo && { ativo: data.ativo }),
      }
      
      if (editingVeiculo) {
        await updateVeiculo.mutateAsync({ id: editingVeiculo.id, ...submitData })
      } else {
        await createVeiculo.mutateAsync(submitData)
      }
      setDialogOpen(false)
      setEditingVeiculo(null)
      form.reset()
    } catch (error) {
      console.error("Erro ao salvar veículo:", error)
    }
  }

  const handleEdit = (veiculo: any) => {
    setEditingVeiculo(veiculo)
    form.reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
      capacidade_peso: veiculo.capacidade_peso,
      capacidade_volume: veiculo.capacidade_volume,
      tipo: veiculo.tipo,
      ativo: veiculo.ativo,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este veículo?")) {
      await deleteVeiculo.mutateAsync(id)
    }
  }

  const handleOpenDialog = () => {
    setEditingVeiculo(null)
    form.reset()
    setDialogOpen(true)
  }

  if (isLoading) return <LoadingState />
  if (error) return <div>Erro ao carregar veículos</div>

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-muted-foreground">Gerencie a frota de veículos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVeiculo ? "Editar Veículo" : "Novo Veículo"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Volvo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="FH16" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="caminhao">Caminhão</SelectItem>
                            <SelectItem value="carreta">Carreta</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {editingVeiculo && (
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacidade_peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade de Peso (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="20000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacidade_volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade de Volume (m³)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createVeiculo.isPending || updateVeiculo.isPending}>
                    {editingVeiculo ? "Atualizar" : "Criar"}
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
            placeholder="Buscar por placa, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredVeiculos?.length === 0 ? (
        <EmptyState
          icon="Truck"
          title="Nenhum veículo encontrado"
          description="Cadastre o primeiro veículo da frota"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVeiculos?.map((veiculo) => (
            <Card key={veiculo.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  {veiculo.placa}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={veiculo.ativo ? "default" : "secondary"}>
                    {veiculo.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(veiculo)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(veiculo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Modelo:</span>
                    <p className="font-medium">{veiculo.marca} {veiculo.modelo}</p>
                  </div>
                  {veiculo.ano && (
                    <div>
                      <span className="text-sm text-muted-foreground">Ano:</span>
                      <p className="font-medium">{veiculo.ano}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <p className="font-medium capitalize">{veiculo.tipo}</p>
                  </div>
                  {(veiculo.capacidade_peso || veiculo.capacidade_volume) && (
                    <div className="grid grid-cols-2 gap-2">
                      {veiculo.capacidade_peso && (
                        <div>
                          <span className="text-sm text-muted-foreground">Peso:</span>
                          <p className="font-medium">{veiculo.capacidade_peso}kg</p>
                        </div>
                      )}
                      {veiculo.capacidade_volume && (
                        <div>
                          <span className="text-sm text-muted-foreground">Volume:</span>
                          <p className="font-medium">{veiculo.capacidade_volume}m³</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}