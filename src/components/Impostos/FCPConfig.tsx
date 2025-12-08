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

interface FCPConfigItem {
  id: string
  uf: string
  percentual: number
  ncm_especifico: string | null
  descricao: string | null
  ativo: boolean
}

export function FCPConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FCPConfigItem | null>(null)
  const [formData, setFormData] = useState({ uf: "", percentual: "", ncm_especifico: "", descricao: "", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["fcp-configuracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("fcp_configuracoes").select("*").order("uf")
      if (error) throw error
      return data as FCPConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { uf: data.uf, percentual: parseFloat(data.percentual), ncm_especifico: data.ncm_especifico || null, descricao: data.descricao || null, ativo: data.ativo }
      if (data.id) {
        const { error } = await (supabase as any).from("fcp_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("fcp_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fcp-configuracoes"] }); toast.success("Salvo"); resetForm() },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("fcp_configuracoes").delete().eq("id", id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fcp-configuracoes"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ uf: "", percentual: "", ncm_especifico: "", descricao: "", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: FCPConfigItem) => {
    setEditingItem(item)
    setFormData({ uf: item.uf, percentual: item.percentual.toString(), ncm_especifico: item.ncm_especifico || "", descricao: item.descricao || "", ativo: item.ativo })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Configuração FCP</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>UF</Label><Select value={formData.uf} onValueChange={(v) => setFormData(p => ({ ...p, uf: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Percentual (%)</Label><Input type="number" step="0.01" value={formData.percentual} onChange={(e) => setFormData(p => ({ ...p, percentual: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2"><Label>NCM Específico (opcional)</Label><Input value={formData.ncm_especifico} onChange={(e) => setFormData(p => ({ ...p, ncm_especifico: e.target.value }))} placeholder="Deixe vazio para aplicar a todos" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>UF</TableHead><TableHead>Percentual</TableHead><TableHead>NCM Específico</TableHead><TableHead>Descrição</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.uf}</TableCell>
                <TableCell>{item.percentual}%</TableCell>
                <TableCell className="font-mono">{item.ncm_especifico || "Todos"}</TableCell>
                <TableCell>{item.descricao || "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
