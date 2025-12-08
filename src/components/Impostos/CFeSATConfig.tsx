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
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CFeSATConfigItem {
  id: string
  tipo_documento: string
  serie: string | null
  numero_atual: number | null
  ambiente: string | null
  codigo_sat: string | null
  certificado_digital: string | null
  ativo: boolean
}

export function CFeSATConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CFeSATConfigItem | null>(null)
  const [formData, setFormData] = useState({ tipo_documento: "nfce", serie: "", numero_atual: "", ambiente: "homologacao", codigo_sat: "", certificado_digital: "", ativo: true })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["cfe-nfce-configuracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cfe_nfce_configuracoes").select("*").order("tipo_documento")
      if (error) throw error
      return data as CFeSATConfigItem[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        tipo_documento: data.tipo_documento,
        serie: data.serie || null,
        numero_atual: data.numero_atual ? parseInt(data.numero_atual) : null,
        ambiente: data.ambiente,
        codigo_sat: data.codigo_sat || null,
        certificado_digital: data.certificado_digital || null,
        ativo: data.ativo
      }
      if (data.id) {
        const { error } = await (supabase as any).from("cfe_nfce_configuracoes").update(payload).eq("id", data.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from("cfe_nfce_configuracoes").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cfe-nfce-configuracoes"] }); toast.success("Salvo"); resetForm() },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("cfe_nfce_configuracoes").delete().eq("id", id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cfe-nfce-configuracoes"] }); toast.success("Excluído") }
  })

  const resetForm = () => { setFormData({ tipo_documento: "nfce", serie: "", numero_atual: "", ambiente: "homologacao", codigo_sat: "", certificado_digital: "", ativo: true }); setEditingItem(null); setIsDialogOpen(false) }

  const handleEdit = (item: CFeSATConfigItem) => {
    setEditingItem(item)
    setFormData({
      tipo_documento: item.tipo_documento,
      serie: item.serie || "",
      numero_atual: item.numero_atual?.toString() || "",
      ambiente: item.ambiente || "homologacao",
      codigo_sat: item.codigo_sat || "",
      certificado_digital: item.certificado_digital || "",
      ativo: item.ativo
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open) }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Configuração</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingItem ? "Editar" : "Nova"} Configuração CF-e/NFC-e</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={formData.tipo_documento} onValueChange={(v) => setFormData(p => ({ ...p, tipo_documento: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cfe_sat">CF-e SAT</SelectItem>
                      <SelectItem value="nfce">NFC-e</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select value={formData.ambiente} onValueChange={(v) => setFormData(p => ({ ...p, ambiente: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Série</Label><Input value={formData.serie} onChange={(e) => setFormData(p => ({ ...p, serie: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Número Atual</Label><Input type="number" value={formData.numero_atual} onChange={(e) => setFormData(p => ({ ...p, numero_atual: e.target.value }))} /></div>
              </div>
              {formData.tipo_documento === "cfe_sat" && (
                <div className="space-y-2"><Label>Código SAT</Label><Input value={formData.codigo_sat} onChange={(e) => setFormData(p => ({ ...p, codigo_sat: e.target.value }))} /></div>
              )}
              <div className="space-y-2"><Label>Certificado Digital (identificador)</Label><Input value={formData.certificado_digital} onChange={(e) => setFormData(p => ({ ...p, certificado_digital: e.target.value }))} placeholder="ID ou nome do certificado" /></div>
              <div className="flex items-center gap-2"><Switch checked={formData.ativo} onCheckedChange={(checked) => setFormData(p => ({ ...p, ativo: checked }))} /><Label>Ativo</Label></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Série</TableHead><TableHead>Número Atual</TableHead><TableHead>Ambiente</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma configuração</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.tipo_documento === "cfe_sat" ? "CF-e SAT" : "NFC-e"}</TableCell>
                <TableCell>{item.serie || "-"}</TableCell>
                <TableCell>{item.numero_atual || "-"}</TableCell>
                <TableCell className="capitalize">{item.ambiente || "-"}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded text-xs ${item.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.ativo ? "Ativo" : "Inativo"}</span></TableCell>
                <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
