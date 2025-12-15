import { useState } from "react"
import { Plus, Search, Truck, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTransportadoras, useCreateTransportadora, useUpdateTransportadora, useDeleteTransportadora } from "@/hooks/useTransportadoras"
import { LoadingState } from "@/components/ui/loading-state"
import { useCliente } from "@/contexts/ClienteContext"

export default function Transportadoras() {
  const { selectedCliente } = useCliente()
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    contato: "",
    email: "",
    especialidade: "",
    regiao_atendimento: "",
    valor_km: "",
    valor_minimo: "",
    ativo: true,
    is_propria: false,
    usarMesmoCnpj: false
  })

  const { data: transportadoras, isLoading } = useTransportadoras(selectedCliente?.id)
  const createMutation = useCreateTransportadora()
  const updateMutation = useUpdateTransportadora()
  const deleteMutation = useDeleteTransportadora()

  const filteredTransportadoras = transportadoras?.filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm)
  )

  // Normaliza CNPJ removendo pontuação para comparação
  const normalizeCnpj = (cnpj: string) => cnpj?.replace(/[^\d]/g, "") || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Se usar mesmo CNPJ, usa o da empresa selecionada
    const cnpjFinal = formData.is_propria && formData.usarMesmoCnpj 
      ? (selectedCliente?.cpf_cnpj || formData.cnpj)
      : formData.cnpj

    const data = {
      nome: formData.nome,
      cnpj: cnpjFinal,
      contato: formData.contato || null,
      email: formData.email || null,
      especialidade: formData.especialidade || null,
      regiao_atendimento: formData.regiao_atendimento || null,
      valor_km: formData.valor_km ? parseFloat(formData.valor_km) : null,
      valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo) : null,
      ativo: formData.ativo,
      is_propria: formData.is_propria,
      cliente_id: selectedCliente?.id
    }

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...data })
    } else {
      await createMutation.mutateAsync(data)
    }
    
    handleCloseDialog()
  }

  const handleEdit = (transportadora: any) => {
    // Verifica se o CNPJ da transportadora é igual ao da empresa para pré-ativar toggle
    const cnpjIgual = normalizeCnpj(transportadora.cnpj) === normalizeCnpj(selectedCliente?.cpf_cnpj || "")
    
    setEditingId(transportadora.id)
    setFormData({
      nome: transportadora.nome,
      cnpj: transportadora.cnpj,
      contato: transportadora.contato || "",
      email: transportadora.email || "",
      especialidade: transportadora.especialidade || "",
      regiao_atendimento: transportadora.regiao_atendimento || "",
      valor_km: transportadora.valor_km?.toString() || "",
      valor_minimo: transportadora.valor_minimo?.toString() || "",
      ativo: transportadora.ativo,
      is_propria: transportadora.is_propria || false,
      usarMesmoCnpj: transportadora.is_propria && cnpjIgual
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transportadora?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setFormData({
      nome: "",
      cnpj: "",
      contato: "",
      email: "",
      especialidade: "",
      regiao_atendimento: "",
      valor_km: "",
      valor_minimo: "",
      ativo: true,
      is_propria: false,
      usarMesmoCnpj: false
    })
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transportadoras</h1>
          <p className="text-muted-foreground">Gerencie transportadoras terceiras</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transportadora
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredTransportadoras && filteredTransportadoras.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransportadoras.map((transportadora) => (
                <TableRow key={transportadora.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      {transportadora.nome}
                    </div>
                  </TableCell>
                  <TableCell>{transportadora.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant={transportadora.is_propria ? "default" : "outline"}>
                      {transportadora.is_propria ? "Própria" : "Terceira"}
                    </Badge>
                  </TableCell>
                  <TableCell>{transportadora.contato || "-"}</TableCell>
                  <TableCell>{transportadora.email || "-"}</TableCell>
                  <TableCell>{transportadora.especialidade || "-"}</TableCell>
                  <TableCell>{transportadora.regiao_atendimento || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={transportadora.ativo ? "default" : "secondary"}>
                      {transportadora.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transportadora)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transportadora.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transportadora cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando sua primeira transportadora terceira
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transportadora
            </Button>
          </div>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Transportadora" : "Nova Transportadora"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.is_propria ? "propria" : "terceira"}
                  onValueChange={(value) => {
                    const isPropria = value === "propria"
                    setFormData({ 
                      ...formData, 
                      is_propria: isPropria,
                      // Limpa toggle e CNPJ se mudar para terceira
                      usarMesmoCnpj: isPropria ? formData.usarMesmoCnpj : false,
                      cnpj: !isPropria && formData.usarMesmoCnpj ? "" : formData.cnpj
                    })
                  }}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propria">Própria</SelectItem>
                    <SelectItem value="terceira">Terceira</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.is_propria && selectedCliente?.cpf_cnpj && (
                <div className="col-span-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="usarMesmoCnpj">Usar mesmo CNPJ da empresa</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedCliente?.razao_social} - {selectedCliente?.cpf_cnpj}
                    </p>
                  </div>
                  <Switch
                    id="usarMesmoCnpj"
                    checked={formData.usarMesmoCnpj}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        usarMesmoCnpj: checked,
                        cnpj: checked ? (selectedCliente?.cpf_cnpj || "") : ""
                      })
                    }}
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.is_propria && formData.usarMesmoCnpj ? (selectedCliente?.cpf_cnpj || "") : formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  disabled={formData.is_propria && formData.usarMesmoCnpj}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contato">Contato</Label>
                <Input
                  id="contato"
                  value={formData.contato}
                  onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                  placeholder="Ex: Cargas frigoríficas"
                />
              </div>
              <div>
                <Label htmlFor="regiao">Região de Atendimento</Label>
                <Input
                  id="regiao"
                  value={formData.regiao_atendimento}
                  onChange={(e) => setFormData({ ...formData, regiao_atendimento: e.target.value })}
                  placeholder="Ex: Sul, Sudeste"
                />
              </div>
              <div>
                <Label htmlFor="valor_km">Valor por KM (R$)</Label>
                <Input
                  id="valor_km"
                  type="number"
                  step="0.01"
                  value={formData.valor_km}
                  onChange={(e) => setFormData({ ...formData, valor_km: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor_minimo">Valor Mínimo (R$)</Label>
                <Input
                  id="valor_minimo"
                  type="number"
                  step="0.01"
                  value={formData.valor_minimo}
                  onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
