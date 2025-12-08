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

interface ICMSSTConfigItem {
  id: string
  ncm: string
  cest: string | null
  mva_original: number | null
  mva_ajustado: number | null
  aliquota: number | null
  uf: string | null
  ativo: boolean
}

export function ICMSSTConfig() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ICMSSTConfigItem | null>(null)
  const [formData, setFormData] = useState({
    ncm: "", cest: "", mva_original: "", mva_ajustado: "", aliquota: "", uf: "", ativo: true
  })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["icms-st-configuracoes", search],
    queryFn: async () => {
      let query = (supabase as any).from("icms_st_configuracoes").select("*").order("ncm")
      if (search) query = query.or(`ncm.ilike.%${search}%,cest.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as ICMSSTConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ncm: data.ncm, cest: data.cest || null, uf: data.uf || null,
        mva_original: data.mva_original ? parseFloat(data.mva_original) : null,
        mva_ajustado: data.mva_ajustado ? parseFloat(data.mva_ajustado) : null,
        aliquota: data.aliquota ? parseFloat(data.aliquota) : null,
        ativo: data.ativo
      }
      if (data.id) {
        const { error } = await (supabase as any).from("icms_st_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("icms_st_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icms-st-configuracoes"] })
      toast.success("Salvo com sucesso")
      resetForm()
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar")
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("icms_st_configuracoes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icms-st-configuracoes"] })
      toast.success("Excluído")
    }
  })

  const resetForm = () => {
    setFormData({ ncm: "", cest: "", mva_original: "", mva_ajustado: "", aliquota: "", uf: "", ativo: true })
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (item: ICMSSTConfigItem) => {
    setEditingItem(item)
    setFormData({
      ncm: item.ncm, cest: item.cest || "", uf: item.uf || "",
      mva_original: item.mva_original?.toString() || "",
      mva_ajustado: item.mva_ajustado?.toString() || "",
      aliquota: item.aliquota?.toString() || "",
      ativo: item.ativo
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por NCM ou CEST..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Configuração ICMS ST</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>NCM</Label><Input value={formData.ncm} onChange={(e) => setFormData(p => ({ ...p, ncm: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>CEST</Label><Input value={formData.cest} onChange={(e) => setFormData(p => ({ ...p, cest: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>MVA Original (%)</Label><Input type="number" step="0.01" value={formData.mva_original} onChange={(e) => setFormData(p => ({ ...p, mva_original: e.target.value }))} /></div>
                <div className="space-y-2"><Label>MVA Ajustado (%)</Label><Input type="number" step="0.01" value={formData.mva_ajustado} onChange={(e) => setFormData(p => ({ ...p, mva_ajustado: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Alíquota (%)</Label><Input type="number" step="0.01" value={formData.aliquota} onChange={(e) => setFormData(p => ({ ...p, aliquota: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>UF (opcional)</Label><Input value={formData.uf} onChange={(e) => setFormData(p => ({ ...p, uf: e.target.value }))} maxLength={2} /></div>
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
              <TableHead>NCM</TableHead><TableHead>CEST</TableHead><TableHead>MVA Original</TableHead><TableHead>MVA Ajustado</TableHead><TableHead>Alíquota</TableHead><TableHead>UF</TableHead><TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.ncm}</TableCell>
                <TableCell>{item.cest || "-"}</TableCell>
                <TableCell>{item.mva_original ? `${item.mva_original}%` : "-"}</TableCell>
                <TableCell>{item.mva_ajustado ? `${item.mva_ajustado}%` : "-"}</TableCell>
                <TableCell>{item.aliquota ? `${item.aliquota}%` : "-"}</TableCell>
                <TableCell>{item.uf || "-"}</TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
