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

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

interface DIFALConfigItem {
  id: string
  uf_origem: string
  uf_destino: string
  aliquota_difal: number | null
  aliquota_fcp: number | null
  ativo: boolean
}

export function DIFALConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DIFALConfigItem | null>(null)
  const [formData, setFormData] = useState({ uf_origem: "", uf_destino: "", aliquota_difal: "", aliquota_fcp: "", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["difal-configuracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("difal_configuracoes").select("*").order("uf_origem").order("uf_destino")
      if (error) throw error
      return data as DIFALConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        uf_origem: data.uf_origem, uf_destino: data.uf_destino,
        aliquota_difal: data.aliquota_difal ? parseFloat(data.aliquota_difal) : null,
        aliquota_fcp: data.aliquota_fcp ? parseFloat(data.aliquota_fcp) : null,
        ativo: data.ativo
      }
      if (data.id) {
        const { error } = await (supabase as any).from("difal_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("difal_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["difal-configuracoes"] })
      toast.success("Salvo")
      resetForm()
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("difal_configuracoes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["difal-configuracoes"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ uf_origem: "", uf_destino: "", aliquota_difal: "", aliquota_fcp: "", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: DIFALConfigItem) => {
    setEditingItem(item)
    setFormData({ uf_origem: item.uf_origem, uf_destino: item.uf_destino, aliquota_difal: item.aliquota_difal?.toString() || "", aliquota_fcp: item.aliquota_fcp?.toString() || "", ativo: item.ativo })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Configuração DIFAL</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>UF Origem</Label><Select value={formData.uf_origem} onValueChange={(v) => setFormData(p => ({ ...p, uf_origem: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>UF Destino</Label><Select value={formData.uf_destino} onValueChange={(v) => setFormData(p => ({ ...p, uf_destino: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Alíquota DIFAL (%)</Label><Input type="number" step="0.01" value={formData.aliquota_difal} onChange={(e) => setFormData(p => ({ ...p, aliquota_difal: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Alíquota FCP (%)</Label><Input type="number" step="0.01" value={formData.aliquota_fcp} onChange={(e) => setFormData(p => ({ ...p, aliquota_fcp: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>UF Origem</TableHead><TableHead>UF Destino</TableHead><TableHead>DIFAL</TableHead><TableHead>FCP</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.uf_origem}</TableCell>
                <TableCell>{item.uf_destino}</TableCell>
                <TableCell>{item.aliquota_difal ? `${item.aliquota_difal}%` : "-"}</TableCell>
                <TableCell>{item.aliquota_fcp ? `${item.aliquota_fcp}%` : "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
