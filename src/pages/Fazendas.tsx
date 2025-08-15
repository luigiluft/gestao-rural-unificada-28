import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface Fazenda {
  id: string
  nome: string
  endereco: string
  cidade?: string
  estado?: string
  cep?: string
  latitude?: number
  longitude?: number
  ativo: boolean
  created_at: string
}

interface FormData {
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  latitude: string
  longitude: string
  ativo: boolean
}

export default function Fazendas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fazendas, setFazendas] = useState<Fazenda[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFazenda, setEditingFazenda] = useState<Fazenda | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    latitude: "",
    longitude: "",
    ativo: true
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      latitude: "",
      longitude: "",
      ativo: true
    })
    setEditingFazenda(null)
  }

  const loadFazendas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("fazendas")
        .select("*")
        .eq("produtor_id", user.id)
        .order("nome")

      if (error) throw error
      setFazendas(data || [])
    } catch (error) {
      console.error("Erro ao carregar fazendas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fazendas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFazendas()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const fazendaData = {
        nome: formData.nome,
        endereco: formData.endereco,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        ativo: formData.ativo,
        produtor_id: user.id
      }

      if (editingFazenda) {
        const { error } = await supabase
          .from("fazendas")
          .update(fazendaData)
          .eq("id", editingFazenda.id)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Fazenda atualizada com sucesso!",
        })
      } else {
        const { error } = await supabase
          .from("fazendas")
          .insert(fazendaData)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Fazenda criada com sucesso!",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadFazendas()
    } catch (error) {
      console.error("Erro ao salvar fazenda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a fazenda.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (fazenda: Fazenda) => {
    setEditingFazenda(fazenda)
    setFormData({
      nome: fazenda.nome,
      endereco: fazenda.endereco,
      cidade: fazenda.cidade || "",
      estado: fazenda.estado || "",
      cep: fazenda.cep || "",
      latitude: fazenda.latitude?.toString() || "",
      longitude: fazenda.longitude?.toString() || "",
      ativo: fazenda.ativo
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fazenda?")) return

    try {
      const { error } = await supabase
        .from("fazendas")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast({
        title: "Sucesso",
        description: "Fazenda excluída com sucesso!",
      })
      loadFazendas()
    } catch (error) {
      console.error("Erro ao excluir fazenda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a fazenda.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Fazendas</h1>
          <p className="text-muted-foreground">Gerencie suas propriedades rurais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Fazenda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFazenda ? "Editar Fazenda" : "Nova Fazenda"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Fazenda</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Fazenda São José"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-23.5489"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-46.6388"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Fazenda ativa</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFazenda ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {fazendas.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma fazenda cadastrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece cadastrando sua primeira propriedade rural
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar Fazenda
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>CEP</TableHead>
                <TableHead>Coordenadas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fazendas.map((fazenda) => (
                <TableRow key={fazenda.id}>
                  <TableCell className="font-medium">{fazenda.nome}</TableCell>
                  <TableCell>{fazenda.endereco}</TableCell>
                  <TableCell>
                    {[fazenda.cidade, fazenda.estado].filter(Boolean).join(" - ") || "-"}
                  </TableCell>
                  <TableCell>{fazenda.cep || "-"}</TableCell>
                  <TableCell>
                    {(fazenda.latitude && fazenda.longitude) 
                      ? `${fazenda.latitude.toFixed(4)}, ${fazenda.longitude.toFixed(4)}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={fazenda.ativo ? "default" : "secondary"}>
                      {fazenda.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(fazenda)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(fazenda.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}