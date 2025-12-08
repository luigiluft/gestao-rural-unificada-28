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

interface AjusteICMSItem {
  id: string
  codigo_ajuste: string
  tipo: string | null
  descricao: string
  valor: number | null
  periodo_referencia: string | null
  ativo: boolean
}

export function AjustesICMSConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AjusteICMSItem | null>(null)
  const [formData, setFormData] = useState({ codigo_ajuste: "", tipo: "credito", descricao: "", valor: "", periodo_referencia: "", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["ajustes-icms"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ajustes_icms").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data as AjusteICMSItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { codigo_ajuste: data.codigo_ajuste, tipo: data.tipo, descricao: data.descricao, valor: data.valor ? parseFloat(data.valor) : null, periodo_referencia: data.periodo_referencia || null, ativo: data.ativo }
      if (data.id) {
        const { error } = await (supabase as any).from("ajustes_icms").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("ajustes_icms").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ajustes-icms"] }); toast.success("Salvo"); resetForm() },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("ajustes_icms").delete().eq("id", id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ajustes-icms"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ codigo_ajuste: "", tipo: "credito", descricao: "", valor: "", periodo_referencia: "", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: AjusteICMSItem) => {
    setEditingItem(item)
    setFormData({ codigo_ajuste: item.codigo_ajuste, tipo: item.tipo || "credito", descricao: item.descricao, valor: item.valor?.toString() || "", periodo_referencia: item.periodo_referencia || "", ativo: item.ativo })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Ajuste</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Novo"} Ajuste de ICMS</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Código do Ajuste</Label><Input value={formData.codigo_ajuste} onChange={(e) => setFormData(p => ({ ...p, codigo_ajuste: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(v) => setFormData(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="credito">Crédito</SelectItem><SelectItem value="debito">Débito</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData(p => ({ ...p, valor: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Período de Referência</Label><Input value={formData.periodo_referencia} onChange={(e) => setFormData(p => ({ ...p, periodo_referencia: e.target.value }))} placeholder="Ex: 01/2024" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Período</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum ajuste cadastrado</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.codigo_ajuste}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded text-xs ${item.tipo === "credito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.tipo === "credito" ? "Crédito" : "Débito"}</span></TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>{item.valor ? `R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}</TableCell>
                <TableCell>{item.periodo_referencia || "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
