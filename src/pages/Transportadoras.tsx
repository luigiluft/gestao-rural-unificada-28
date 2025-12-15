import { useState } from "react"
import { Plus, Search, Truck, Edit, Trash2, Check, X } from "lucide-react"
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
import { useBuscarTransportadoraPlataforma } from "@/hooks/useBuscarTransportadoraPlataforma"
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
    ativo: true,
    is_propria: false, // Local UI only - not saved to database
    usarMesmoCnpj: false
  })
  
  // Estado para busca de transportadora por CNPJ
  const [cnpjBusca, setCnpjBusca] = useState("")
  const { buscarPorCnpj, limpar: limparBusca, buscando, resultado: transportadoraEncontrada } = useBuscarTransportadoraPlataforma()

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
      ativo: formData.ativo,
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
      ativo: transportadora.ativo,
      is_propria: cnpjIgual, // Infer from CNPJ match
      usarMesmoCnpj: cnpjIgual
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
      ativo: true,
      is_propria: false,
      usarMesmoCnpj: false
    })
    setCnpjBusca("")
    limparBusca()
  }

  const handleBuscarTransportadora = async () => {
    if (!cnpjBusca.trim()) return
    await buscarPorCnpj(cnpjBusca)
  }

  const handleUsarDadosEncontrados = () => {
    if (!transportadoraEncontrada) return
    setFormData({
      ...formData,
      nome: transportadoraEncontrada.razao_social || "",
      cnpj: transportadoraEncontrada.cnpj || ""
    })
    limparBusca()
    setCnpjBusca("")
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
          <p className="text-muted-foreground">Gerencie transportadoras próprias e terceiras</p>
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
              <TableHead>Contato</TableHead>
              <TableHead>Email</TableHead>
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
                  <TableCell>{transportadora.contato || "-"}</TableCell>
                  <TableCell>{transportadora.email || "-"}</TableCell>
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
              Comece cadastrando sua primeira transportadora
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
                    // Limpa busca quando mudar tipo
                    limparBusca()
                    setCnpjBusca("")
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

              {/* Busca por CNPJ - apenas para terceiras */}
              {!formData.is_propria && !editingId && (
                <Card className="col-span-2 p-4 space-y-3 border-dashed">
                  <Label>Buscar Transportadora na Plataforma</Label>
                  <p className="text-sm text-muted-foreground">
                    Pesquise por CNPJ para encontrar transportadoras cadastradas e suas tabelas de frete públicas
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Digite o CNPJ..." 
                      value={cnpjBusca}
                      onChange={(e) => setCnpjBusca(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleBuscarTransportadora} 
                      disabled={buscando || !cnpjBusca.trim()}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {buscando ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                  
                  {transportadoraEncontrada && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800 dark:text-green-400">Encontrada!</span>
                      </div>
                      <p className="text-sm">{transportadoraEncontrada.razao_social}</p>
                      <p className="text-sm text-muted-foreground">CNPJ: {transportadoraEncontrada.cnpj}</p>
                      {transportadoraEncontrada.tem_tabelas_frete && (
                        <p className="text-sm text-green-600 mt-1">✓ Possui tabelas de frete públicas</p>
                      )}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={handleUsarDadosEncontrados}
                      >
                        Usar dados
                      </Button>
                    </div>
                  )}

                  {cnpjBusca && !buscando && !transportadoraEncontrada && (
                    <div className="p-3 bg-muted rounded border">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Nenhuma transportadora encontrada. Preencha os dados manualmente.
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
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
