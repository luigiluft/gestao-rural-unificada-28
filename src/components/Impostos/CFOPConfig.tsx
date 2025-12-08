import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface CFOPConfig {
  id: string
  codigo: string
  descricao: string
  natureza_operacao: string | null
  tipo_operacao: string | null
  ativo: boolean
}

export function CFOPConfig() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CFOPConfig | null>(null)
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    natureza_operacao: "",
    tipo_operacao: "saida",
    ativo: true
  })

  const queryClient = useQueryClient()

  const { data: cfops, isLoading } = useQuery({
    queryKey: ["cfop-configuracoes", search],
    queryFn: async () => {
      let query = (supabase as any)
        .from("cfop_configuracoes")
        .select("*")
        .order("codigo")
      
      if (search) {
        query = query.or(`codigo.ilike.%${search}%,descricao.ilike.%${search}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as CFOPConfig[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await (supabase as any)
          .from("cfop_configuracoes")
          .update(data)
          .eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from("cfop_configuracoes")
          .insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cfop-configuracoes"] })
      toast.success(editingItem ? "CFOP atualizado" : "CFOP cadastrado")
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar CFOP")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("cfop_configuracoes")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cfop-configuracoes"] })
      toast.success("CFOP excluído")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir CFOP")
    }
  })

  const resetForm = () => {
    setFormData({
      codigo: "",
      descricao: "",
      natureza_operacao: "",
      tipo_operacao: "saida",
      ativo: true
    })
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (item: CFOPConfig) => {
    setEditingItem(item)
    setFormData({
      codigo: item.codigo,
      descricao: item.descricao,
      natureza_operacao: item.natureza_operacao || "",
      tipo_operacao: item.tipo_operacao || "saida",
      ativo: item.ativo
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo CFOP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar CFOP" : "Novo CFOP"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: 5102"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Operação</Label>
                  <Select
                    value={formData.tipo_operacao}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_operacao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do CFOP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Natureza da Operação</Label>
                <Input
                  value={formData.natureza_operacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, natureza_operacao: e.target.value }))}
                  placeholder="Ex: Venda de mercadoria"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label>Ativo</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Natureza</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="w-20">Ativo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !cfops?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum CFOP cadastrado
                </TableCell>
              </TableRow>
            ) : (
              cfops.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.codigo}</TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell>{item.natureza_operacao || "-"}</TableCell>
                  <TableCell className="capitalize">{item.tipo_operacao || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${item.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {item.ativo ? "Sim" : "Não"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
