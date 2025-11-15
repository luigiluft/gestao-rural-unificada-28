import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building2, Trash2 } from "lucide-react"
import { useTodasFranquias } from "@/hooks/useDepositosDisponiveis"
import { 
  useClienteFiliais, 
  useCreateClienteFilial, 
  useUpdateClienteFilial,
  useDeleteClienteFilial 
} from "@/hooks/useClienteFiliais"
import { toast } from "sonner"

interface GerenciarFiliaisProps {
  clienteId: string
}

export const GerenciarFiliais = ({ clienteId }: GerenciarFiliaisProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    franquia_id: "",
    codigo_interno: "",
    endereco_complementar: "",
    contato_local: ""
  })

  const { data: filiais, isLoading } = useClienteFiliais(clienteId)
  const { data: franquias } = useTodasFranquias()
  const createFilial = useCreateClienteFilial()
  const deleteFilial = useDeleteClienteFilial()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.franquia_id) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    createFilial.mutate({
      cliente_id: clienteId,
      franquia_id: formData.franquia_id,
      nome: formData.nome,
      codigo_interno: formData.codigo_interno || null,
      endereco_complementar: formData.endereco_complementar || null,
      contato_local: formData.contato_local || null
    }, {
      onSuccess: () => {
        setFormData({
          nome: "",
          franquia_id: "",
          codigo_interno: "",
          endereco_complementar: "",
          contato_local: ""
        })
        setIsDialogOpen(false)
      }
    })
  }

  const handleDelete = (filialId: string) => {
    if (window.confirm("Deseja realmente desativar esta filial?")) {
      deleteFilial.mutate(filialId)
    }
  }

  // Filtrar franquias que já possuem filial deste cliente
  const franquiasDisponiveis = franquias?.filter(f => 
    !filiais?.some(fil => fil.franquia_id === f.id)
  ) || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Filiais
            </CardTitle>
            <CardDescription>
              Gerencie as filiais deste cliente empresa
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Filial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Filial</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Filial *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Filial São Paulo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_interno">Código Interno</Label>
                    <Input
                      id="codigo_interno"
                      value={formData.codigo_interno}
                      onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                      placeholder="Ex: SP-001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="franquia">Franquia (Localização) *</Label>
                  <Select 
                    value={formData.franquia_id} 
                    onValueChange={(value) => setFormData({ ...formData, franquia_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione onde a filial será hospedada" />
                    </SelectTrigger>
                    <SelectContent>
                      {franquiasDisponiveis.map((franquia) => (
                        <SelectItem key={franquia.id} value={franquia.id}>
                          {franquia.nome} - {franquia.cnpj}
                        </SelectItem>
                      ))}
                      {franquiasDisponiveis.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhuma franquia disponível (limite: 1 filial por franquia)
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Complementar</Label>
                  <Textarea
                    id="endereco"
                    value={formData.endereco_complementar}
                    onChange={(e) => setFormData({ ...formData, endereco_complementar: e.target.value })}
                    placeholder="Informações adicionais de endereço se diferente da franquia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Contato Local</Label>
                  <Input
                    id="contato"
                    value={formData.contato_local}
                    onChange={(e) => setFormData({ ...formData, contato_local: e.target.value })}
                    placeholder="Nome e telefone do responsável"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createFilial.isPending}>
                    {createFilial.isPending ? "Criando..." : "Criar Filial"}
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
            Carregando filiais...
          </div>
        ) : !filiais || filiais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma filial cadastrada.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Franquia (Localização)</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filiais.map((filial) => (
                <TableRow key={filial.id}>
                  <TableCell className="font-medium">{filial.nome}</TableCell>
                  <TableCell>{filial.codigo_interno || "-"}</TableCell>
                  <TableCell>
                    {filial.franquia?.nome}
                    {filial.endereco_complementar && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {filial.endereco_complementar}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{filial.contato_local || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(filial.id)}
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
