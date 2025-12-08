import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface IPIConfigItem {
  id: string
  ncm: string
  descricao: string | null
  aliquota: number
  codigo_ex: string | null
  ativo: boolean
}

export function IPIConfig() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IPIConfigItem | null>(null)
  const [formData, setFormData] = useState({ ncm: "", descricao: "", aliquota: "", codigo_ex: "", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["ipi-configuracoes", search],
    queryFn: async () => {
      let query = (supabase as any).from("ipi_configuracoes").select("*").order("ncm")
      if (search) query = query.or(`ncm.ilike.%${search}%,descricao.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as IPIConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ncm: data.ncm, descricao: data.descricao || null, aliquota: parseFloat(data.aliquota), codigo_ex: data.codigo_ex || null, ativo: data.ativo }
      if (data.id) {
        const { error } = await (supabase as any).from("ipi_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("ipi_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ipi-configuracoes"] }); toast.success("Salvo"); resetForm() },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("ipi_configuracoes").delete().eq("id", id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ipi-configuracoes"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ ncm: "", descricao: "", aliquota: "", codigo_ex: "", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: IPIConfigItem) => {
    setEditingItem(item)
    setFormData({ ncm: item.ncm, descricao: item.descricao || "", aliquota: item.aliquota.toString(), codigo_ex: item.codigo_ex || "", ativo: item.ativo })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por NCM..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Alíquota IPI</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>NCM</Label><Input value={formData.ncm} onChange={(e) => setFormData(p => ({ ...p, ncm: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Alíquota (%)</Label><Input type="number" step="0.01" value={formData.aliquota} onChange={(e) => setFormData(p => ({ ...p, aliquota: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Código Ex</Label><Input value={formData.codigo_ex} onChange={(e) => setFormData(p => ({ ...p, codigo_ex: e.target.value }))} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>NCM</TableHead><TableHead>Descrição</TableHead><TableHead>Alíquota</TableHead><TableHead>Código Ex</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.ncm}</TableCell>
                <TableCell>{item.descricao || "-"}</TableCell>
                <TableCell>{item.aliquota}%</TableCell>
                <TableCell>{item.codigo_ex || "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
