import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", 
  "SP", "SE", "TO"
]

interface ICMSConfigItem {
  id: string
  uf_origem: string
  uf_destino: string
  aliquota_interna: number | null
  aliquota_interestadual: number | null
  ativo: boolean
}

export function ICMSConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ICMSConfigItem | null>(null)
  const [formData, setFormData] = useState({
    uf_origem: "",
    uf_destino: "",
    aliquota_interna: "",
    aliquota_interestadual: "",
    ativo: true
  })

  const queryClient = useQueryClient()

  const { data: icmsConfigs, isLoading } = useQuery({
    queryKey: ["icms-configuracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("icms_configuracoes")
        .select("*")
        .order("uf_origem")
        .order("uf_destino")
      if (error) throw error
      return data as ICMSConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        uf_origem: data.uf_origem,
        uf_destino: data.uf_destino,
        aliquota_interna: data.aliquota_interna ? parseFloat(data.aliquota_interna) : null,
        aliquota_interestadual: data.aliquota_interestadual ? parseFloat(data.aliquota_interestadual) : null,
        ativo: data.ativo
      }
      
      if (data.id) {
        const { error } = await (supabase as any)
          .from("icms_configuracoes")
          .update(payload)
          .eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from("icms_configuracoes")
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icms-configuracoes"] })
      toast.success(editingItem ? "Alíquota atualizada" : "Alíquota cadastrada")
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("icms_configuracoes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icms-configuracoes"] })
      toast.success("Registro excluído")
    }
  })

  const resetForm = () => {
    setFormData({ uf_origem: "", uf_destino: "", aliquota_interna: "", aliquota_interestadual: "", ativo: true })
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (item: ICMSConfigItem) => {
    setEditingItem(item)
    setFormData({
      uf_origem: item.uf_origem,
      uf_destino: item.uf_destino,
      aliquota_interna: item.aliquota_interna?.toString() || "",
      aliquota_interestadual: item.aliquota_interestadual?.toString() || "",
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
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Alíquota</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Nova"} Alíquota ICMS</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UF Origem</Label>
                  <Select value={formData.uf_origem} onValueChange={(v) => setFormData(p => ({ ...p, uf_origem: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>UF Destino</Label>
                  <Select value={formData.uf_destino} onValueChange={(v) => setFormData(p => ({ ...p, uf_destino: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alíquota Interna (%)</Label>
                  <Input type="number" step="0.01" value={formData.aliquota_interna} onChange={(e) => setFormData(p => ({ ...p, aliquota_interna: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota Interestadual (%)</Label>
                  <Input type="number" step="0.01" value={formData.aliquota_interestadual} onChange={(e) => setFormData(p => ({ ...p, aliquota_interestadual: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UF Origem</TableHead>
              <TableHead>UF Destino</TableHead>
              <TableHead>Alíquota Interna</TableHead>
              <TableHead>Alíquota Interestadual</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : !icmsConfigs?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma alíquota cadastrada</TableCell></TableRow>
            ) : (
              icmsConfigs.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.uf_origem}</TableCell>
                  <TableCell>{item.uf_destino}</TableCell>
                  <TableCell>{item.aliquota_interna ? `${item.aliquota_interna}%` : "-"}</TableCell>
                  <TableCell>{item.aliquota_interestadual ? `${item.aliquota_interestadual}%` : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
