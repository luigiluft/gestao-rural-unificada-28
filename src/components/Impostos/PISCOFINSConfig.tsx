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

interface PISCOFINSConfigItem {
  id: string
  cst: string
  descricao: string | null
  aliquota_pis: number | null
  aliquota_cofins: number | null
  regime: string | null
  ativo: boolean
}

export function PISCOFINSConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PISCOFINSConfigItem | null>(null)
  const [formData, setFormData] = useState({ cst: "", descricao: "", aliquota_pis: "", aliquota_cofins: "", regime: "nao_cumulativo", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["pis-cofins-configuracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("pis_cofins_configuracoes").select("*").order("cst")
      if (error) throw error
      return data as PISCOFINSConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        cst: data.cst, descricao: data.descricao || null, regime: data.regime,
        aliquota_pis: data.aliquota_pis ? parseFloat(data.aliquota_pis) : null,
        aliquota_cofins: data.aliquota_cofins ? parseFloat(data.aliquota_cofins) : null,
        ativo: data.ativo
      }
      if (data.id) {
        const { error } = await (supabase as any).from("pis_cofins_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("pis_cofins_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pis-cofins-configuracoes"] }); toast.success("Salvo"); resetForm() },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("pis_cofins_configuracoes").delete().eq("id", id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pis-cofins-configuracoes"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ cst: "", descricao: "", aliquota_pis: "", aliquota_cofins: "", regime: "nao_cumulativo", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: PISCOFINSConfigItem) => {
    setEditingItem(item)
    setFormData({ cst: item.cst, descricao: item.descricao || "", aliquota_pis: item.aliquota_pis?.toString() || "", aliquota_cofins: item.aliquota_cofins?.toString() || "", regime: item.regime || "nao_cumulativo", ativo: item.ativo })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Configuração PIS/COFINS</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CST</Label><Input value={formData.cst} onChange={(e) => setFormData(p => ({ ...p, cst: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Regime</Label><Select value={formData.regime} onValueChange={(v) => setFormData(p => ({ ...p, regime: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cumulativo">Cumulativo</SelectItem><SelectItem value="nao_cumulativo">Não Cumulativo</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Alíquota PIS (%)</Label><Input type="number" step="0.01" value={formData.aliquota_pis} onChange={(e) => setFormData(p => ({ ...p, aliquota_pis: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Alíquota COFINS (%)</Label><Input type="number" step="0.01" value={formData.aliquota_cofins} onChange={(e) => setFormData(p => ({ ...p, aliquota_cofins: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>CST</TableHead><TableHead>Descrição</TableHead><TableHead>PIS</TableHead><TableHead>COFINS</TableHead><TableHead>Regime</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.cst}</TableCell>
                <TableCell>{item.descricao || "-"}</TableCell>
                <TableCell>{item.aliquota_pis ? `${item.aliquota_pis}%` : "-"}</TableCell>
                <TableCell>{item.aliquota_cofins ? `${item.aliquota_cofins}%` : "-"}</TableCell>
                <TableCell className="capitalize">{item.regime?.replace("_", " ") || "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
