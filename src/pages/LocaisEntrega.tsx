import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, MapPin, Building2, Store, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { type LocalEntrega, type TipoLocal } from "@/hooks/useLocaisEntrega"

const tipoLocalIcons = {
  fazenda: MapPin,
  filial: Building2,
  centro_distribuicao: Warehouse,
  loja: Store,
  armazem: Warehouse,
  outro: MapPin,
}

const tipoLocalLabels: Record<TipoLocal, string> = {
  fazenda: "Fazenda",
  filial: "Filial",
  centro_distribuicao: "Centro de Distribuição",
  loja: "Loja",
  armazem: "Armazém",
  outro: "Outro",
}

export default function LocaisEntrega() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [locais, setLocais] = useState<LocalEntrega[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocal, setEditingLocal] = useState<LocalEntrega | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    tipo_local: "fazenda" as TipoLocal,
    is_rural: false,
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    latitude: "",
    longitude: "",
    telefone_contato: "",
    email_contato: "",
    inscricao_estadual: "",
    // Rural fields
    codigo_imovel_rural: "",
    cadastro_ambiental_rural: "",
    area_total_ha: "",
    tipo_producao: "",
    capacidade_armazenagem_ton: "",
    infraestrutura: "",
    nome_responsavel: "",
    ativo: true,
  })

  const loadLocais = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("locais_entrega")
        .select("*")
        .eq("produtor_id", user.id)
        .order("nome")

      if (error) throw error
      setLocais(data || [])
    } catch (error) {
      console.error("Erro ao carregar locais de entrega:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os locais de entrega.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocais()
  }, [user])

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo_local: "fazenda",
      is_rural: false,
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      latitude: "",
      longitude: "",
      telefone_contato: "",
      email_contato: "",
      inscricao_estadual: "",
      codigo_imovel_rural: "",
      cadastro_ambiental_rural: "",
      area_total_ha: "",
      tipo_producao: "",
      capacidade_armazenagem_ton: "",
      infraestrutura: "",
      nome_responsavel: "",
      ativo: true,
    })
    setEditingLocal(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const localData = {
        nome: formData.nome,
        tipo_local: formData.tipo_local,
        is_rural: formData.is_rural,
        endereco: formData.endereco,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        telefone_contato: formData.telefone_contato || null,
        email_contato: formData.email_contato || null,
        inscricao_estadual: formData.inscricao_estadual || null,
        codigo_imovel_rural: formData.codigo_imovel_rural || null,
        cadastro_ambiental_rural: formData.cadastro_ambiental_rural || null,
        area_total_ha: formData.area_total_ha ? parseFloat(formData.area_total_ha) : null,
        tipo_producao: formData.tipo_producao || null,
        capacidade_armazenagem_ton: formData.capacidade_armazenagem_ton ? parseFloat(formData.capacidade_armazenagem_ton) : null,
        infraestrutura: formData.infraestrutura || null,
        nome_responsavel: formData.nome_responsavel || null,
        ativo: formData.ativo,
        produtor_id: user.id,
        cliente_id: user.id, // Assuming user is both produtor and cliente
      }

      if (editingLocal) {
        const { error } = await supabase
          .from("locais_entrega")
          .update(localData)
          .eq("id", editingLocal.id)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Local de entrega atualizado com sucesso!",
        })
      } else {
        const { error } = await supabase
          .from("locais_entrega")
          .insert(localData)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Local de entrega criado com sucesso!",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadLocais()
    } catch (error) {
      console.error("Erro ao salvar local de entrega:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o local de entrega.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (local: LocalEntrega) => {
    setEditingLocal(local)
    setFormData({
      nome: local.nome,
      tipo_local: local.tipo_local,
      is_rural: local.is_rural,
      endereco: local.endereco,
      numero: local.numero || "",
      complemento: local.complemento || "",
      bairro: local.bairro || "",
      cidade: local.cidade,
      estado: local.estado,
      cep: local.cep,
      latitude: local.latitude?.toString() || "",
      longitude: local.longitude?.toString() || "",
      telefone_contato: local.telefone_contato || "",
      email_contato: local.email_contato || "",
      inscricao_estadual: local.inscricao_estadual || "",
      codigo_imovel_rural: local.codigo_imovel_rural || "",
      cadastro_ambiental_rural: local.cadastro_ambiental_rural || "",
      area_total_ha: local.area_total_ha?.toString() || "",
      tipo_producao: local.tipo_producao || "",
      capacidade_armazenagem_ton: local.capacidade_armazenagem_ton?.toString() || "",
      infraestrutura: local.infraestrutura || "",
      nome_responsavel: local.nome_responsavel || "",
      ativo: local.ativo,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este local de entrega?")) return

    try {
      const { error } = await supabase
        .from("locais_entrega")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast({
        title: "Sucesso",
        description: "Local de entrega excluído com sucesso!",
      })
      loadLocais()
    } catch (error) {
      console.error("Erro ao excluir local de entrega:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o local de entrega.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const TipoIcon = tipoLocalIcons[formData.tipo_local]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locais de Entrega</h1>
          <p className="text-muted-foreground">
            Gerencie seus endereços de entrega - fazendas, filiais, lojas, armazéns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Local
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TipoIcon className="w-5 h-5" />
                {editingLocal ? "Editar Local de Entrega" : "Novo Local de Entrega"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Local *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Fazenda São José ou Filial Centro"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_local">Tipo de Local *</Label>
                    <Select
                      value={formData.tipo_local}
                      onValueChange={(value: TipoLocal) => {
                        const isRural = value === 'fazenda'
                        setFormData({ ...formData, tipo_local: value, is_rural: isRural })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoLocalLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Local ativo</Label>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, avenida, estrada"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Sala, andar, etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="00000-000"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Nome da cidade"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado (UF) *</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone_contato">Telefone</Label>
                    <Input
                      id="telefone_contato"
                      value={formData.telefone_contato}
                      onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_contato">E-mail</Label>
                    <Input
                      id="email_contato"
                      type="email"
                      value={formData.email_contato}
                      onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Rural-specific fields - only show if is_rural is true */}
              {formData.is_rural && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informações Rurais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_imovel_rural">Código do Imóvel Rural</Label>
                      <Input
                        id="codigo_imovel_rural"
                        value={formData.codigo_imovel_rural}
                        onChange={(e) => setFormData({ ...formData, codigo_imovel_rural: e.target.value })}
                        placeholder="NIRF"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cadastro_ambiental_rural">CAR</Label>
                      <Input
                        id="cadastro_ambiental_rural"
                        value={formData.cadastro_ambiental_rural}
                        onChange={(e) => setFormData({ ...formData, cadastro_ambiental_rural: e.target.value })}
                        placeholder="Cadastro Ambiental Rural"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area_total_ha">Área Total (ha)</Label>
                      <Input
                        id="area_total_ha"
                        type="number"
                        step="0.01"
                        value={formData.area_total_ha}
                        onChange={(e) => setFormData({ ...formData, area_total_ha: e.target.value })}
                        placeholder="150.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_producao">Tipo de Produção</Label>
                      <Input
                        id="tipo_producao"
                        value={formData.tipo_producao}
                        onChange={(e) => setFormData({ ...formData, tipo_producao: e.target.value })}
                        placeholder="Ex: Soja, Milho"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacidade_armazenagem_ton">Capacidade (ton)</Label>
                      <Input
                        id="capacidade_armazenagem_ton"
                        type="number"
                        step="0.01"
                        value={formData.capacidade_armazenagem_ton}
                        onChange={(e) => setFormData({ ...formData, capacidade_armazenagem_ton: e.target.value })}
                        placeholder="1000.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingLocal ? "Atualizar" : "Criar"} Local
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum local de entrega cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              locais.map((local) => {
                const Icon = tipoLocalIcons[local.tipo_local]
                return (
                  <TableRow key={local.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {local.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tipoLocalLabels[local.tipo_local]}</Badge>
                    </TableCell>
                    <TableCell>
                      {local.cidade} - {local.estado}
                    </TableCell>
                    <TableCell>
                      {local.telefone_contato || local.email_contato || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={local.ativo ? "default" : "secondary"}>
                        {local.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(local)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(local.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}