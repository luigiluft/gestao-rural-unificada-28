import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface IBPTConfigItem {
  id: string
  ncm: string
  ex: string | null
  descricao: string | null
  nacional_federal: number | null
  importados_federal: number | null
  estadual: number | null
  municipal: number | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
}

export function IBPTConfig() {
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ["ibpt-configuracoes", search],
    queryFn: async () => {
      let query = (supabase as any).from("ibpt_configuracoes").select("*").order("ncm").limit(100)
      if (search) query = query.or(`ncm.ilike.%${search}%,descricao.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as IBPTConfigItem[]
    }
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("ibpt_configuracoes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ibpt-configuracoes"] }); toast.success("Tabela limpa") }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.info("Processando arquivo...")
    const text = await file.text()
    const lines = text.split("\n").filter(l => l.trim())
    
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";")
      if (cols.length >= 7) {
        records.push({
          ncm: cols[0]?.trim(),
          ex: cols[1]?.trim() || null,
          descricao: cols[2]?.trim() || null,
          nacional_federal: parseFloat(cols[3]?.replace(",", ".")) || null,
          importados_federal: parseFloat(cols[4]?.replace(",", ".")) || null,
          estadual: parseFloat(cols[5]?.replace(",", ".")) || null,
          municipal: parseFloat(cols[6]?.replace(",", ".")) || null
        })
      }
    }

    if (records.length === 0) {
      toast.error("Arquivo vazio ou formato inválido")
      return
    }

    // Insert in batches
    const batchSize = 500
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { error } = await (supabase as any).from("ibpt_configuracoes").insert(batch)
      if (error) {
        toast.error(`Erro ao importar: ${error.message}`)
        return
      }
    }

    queryClient.invalidateQueries({ queryKey: ["ibpt-configuracoes"] })
    toast.success(`${records.length} registros importados`)
    e.target.value = ""
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por NCM..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />Limpar Tabela
          </Button>
          <div className="relative">
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Button><Upload className="h-4 w-4 mr-2" />Importar CSV</Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Importe a tabela IBPT no formato CSV com colunas: NCM;Ex;Descrição;Nacional;Importados;Estadual;Municipal
      </p>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NCM</TableHead>
              <TableHead>Ex</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Nacional</TableHead>
              <TableHead>Importados</TableHead>
              <TableHead>Estadual</TableHead>
              <TableHead>Municipal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow> :
            !items?.length ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro. Importe a tabela IBPT.</TableCell></TableRow> :
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.ncm}</TableCell>
                <TableCell>{item.ex || "-"}</TableCell>
                <TableCell className="max-w-xs truncate">{item.descricao || "-"}</TableCell>
                <TableCell>{item.nacional_federal ? `${item.nacional_federal}%` : "-"}</TableCell>
                <TableCell>{item.importados_federal ? `${item.importados_federal}%` : "-"}</TableCell>
                <TableCell>{item.estadual ? `${item.estadual}%` : "-"}</TableCell>
                <TableCell>{item.municipal ? `${item.municipal}%` : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {items && items.length >= 100 && <p className="text-sm text-muted-foreground text-center">Mostrando primeiros 100 registros. Use a busca para filtrar.</p>}
    </div>
  )
}
