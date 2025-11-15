import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Tractor, Trash2 } from "lucide-react"
import { useFazendas } from "@/hooks/useProfile"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface GerenciarFazendasProps {
  clienteId: string
  produtorId: string
}

export const GerenciarFazendas = ({ clienteId, produtorId }: GerenciarFazendasProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    area_hectares: ""
  })

  const { data: fazendas, isLoading } = useFazendas(produtorId)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome) {
      toast.error("Preencha o nome da fazenda")
      return
    }

    try {
      const { error } = await supabase
        .from("fazendas")
        .insert({
          nome: formData.nome,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          area_total_ha: formData.area_hectares ? parseFloat(formData.area_hectares) : null,
          produtor_id: produtorId,
          cliente_id: clienteId,
          ativo: true
        })

      if (error) throw error

      toast.success("Fazenda criada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["fazendas", produtorId] })
      setFormData({
        nome: "",
        endereco: "",
        cidade: "",
        estado: "",
        area_hectares: ""
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erro ao criar fazenda:", error)
      toast.error("Erro ao criar fazenda")
    }
  }

  const handleDelete = async (fazendaId: string) => {
    if (!window.confirm("Deseja realmente desativar esta fazenda?")) return

    try {
      const { error } = await supabase
        .from("fazendas")
        .update({ ativo: false })
        .eq("id", fazendaId)

      if (error) throw error

      toast.success("Fazenda desativada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["fazendas", produtorId] })
    } catch (error) {
      console.error("Erro ao desativar fazenda:", error)
      toast.error("Erro ao desativar fazenda")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tractor className="h-5 w-5" />
              Fazendas
            </CardTitle>
            <CardDescription>
              Gerencie as fazendas deste produtor rural
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Fazenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Fazenda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Fazenda *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Fazenda Santa Maria"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Ex: Ribeirão Preto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="Ex: SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área (hectares)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    value={formData.area_hectares}
                    onChange={(e) => setFormData({ ...formData, area_hectares: e.target.value })}
                    placeholder="Ex: 150.50"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Fazenda
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando fazendas...
          </div>
        ) : !fazendas || fazendas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma fazenda cadastrada.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Área (ha)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fazendas.map((fazenda) => (
                <TableRow key={fazenda.id}>
                  <TableCell className="font-medium">{fazenda.nome}</TableCell>
                  <TableCell>
                    {fazenda.cidade && fazenda.estado 
                      ? `${fazenda.cidade} - ${fazenda.estado}`
                      : fazenda.endereco || "-"
                    }
                  </TableCell>
                  <TableCell>
                    {fazenda.area_total_ha 
                      ? `${Number(fazenda.area_total_ha).toLocaleString("pt-BR")} ha`
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(fazenda.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
