import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface Fazenda {
  id: string
  nome: string
  endereco: string
  cidade?: string
  estado?: string
  cep?: string
  latitude?: number
  longitude?: number
  ativo: boolean
  created_at: string
  
  // Fiscal identification
  inscricao_estadual?: string
  uf_ie?: string
  cpf_cnpj_proprietario?: string
  situacao_cadastral?: string
  
  // Location and Address
  tipo_logradouro?: string
  nome_logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  codigo_ibge_municipio?: string
  uf?: string
  referencia?: string
  
  // Rural-specific data
  codigo_imovel_rural?: string
  cadastro_ambiental_rural?: string
  area_total_ha?: number
  tipo_producao?: string
  capacidade_armazenagem_ton?: number
  infraestrutura?: string
  
  // Contact
  nome_responsavel?: string
  telefone_contato?: string
  email_contato?: string
}

interface FormData {
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  latitude: string
  longitude: string
  ativo: boolean
  
  // Fiscal identification
  inscricao_estadual: string
  uf_ie: string
  cpf_cnpj_proprietario: string
  situacao_cadastral: string
  
  // Location and Address
  tipo_logradouro: string
  nome_logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  codigo_ibge_municipio: string
  uf: string
  referencia: string
  
  // Rural-specific data
  codigo_imovel_rural: string
  cadastro_ambiental_rural: string
  area_total_ha: string
  tipo_producao: string
  capacidade_armazenagem_ton: string
  infraestrutura: string
  
  // Contact
  nome_responsavel: string
  telefone_contato: string
  email_contato: string
}

export default function Fazendas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fazendas, setFazendas] = useState<Fazenda[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFazenda, setEditingFazenda] = useState<Fazenda | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    latitude: "",
    longitude: "",
    ativo: true,
    
    // Fiscal identification
    inscricao_estadual: "",
    uf_ie: "",
    cpf_cnpj_proprietario: "",
    situacao_cadastral: "ativa",
    
    // Location and Address
    tipo_logradouro: "",
    nome_logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    municipio: "",
    codigo_ibge_municipio: "",
    uf: "",
    referencia: "",
    
    // Rural-specific data
    codigo_imovel_rural: "",
    cadastro_ambiental_rural: "",
    area_total_ha: "",
    tipo_producao: "",
    capacidade_armazenagem_ton: "",
    infraestrutura: "",
    
    // Contact
    nome_responsavel: "",
    telefone_contato: "",
    email_contato: ""
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      latitude: "",
      longitude: "",
      ativo: true,
      
      // Fiscal identification
      inscricao_estadual: "",
      uf_ie: "",
      cpf_cnpj_proprietario: "",
      situacao_cadastral: "ativa",
      
      // Location and Address
      tipo_logradouro: "",
      nome_logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: "",
      codigo_ibge_municipio: "",
      uf: "",
      referencia: "",
      
      // Rural-specific data
      codigo_imovel_rural: "",
      cadastro_ambiental_rural: "",
      area_total_ha: "",
      tipo_producao: "",
      capacidade_armazenagem_ton: "",
      infraestrutura: "",
      
      // Contact
      nome_responsavel: "",
      telefone_contato: "",
      email_contato: ""
    })
    setEditingFazenda(null)
  }

  const loadFazendas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("fazendas")
        .select("*")
        .eq("produtor_id", user.id)
        .order("nome")

      if (error) throw error
      setFazendas(data || [])
    } catch (error) {
      console.error("Erro ao carregar fazendas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fazendas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFazendas()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const fazendaData = {
        nome: formData.nome,
        endereco: formData.endereco,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        ativo: formData.ativo,
        produtor_id: user.id,
        
        // Fiscal identification
        inscricao_estadual: formData.inscricao_estadual || null,
        uf_ie: formData.uf_ie || null,
        cpf_cnpj_proprietario: formData.cpf_cnpj_proprietario || null,
        situacao_cadastral: formData.situacao_cadastral || 'ativa',
        
        // Location and Address
        tipo_logradouro: formData.tipo_logradouro || null,
        nome_logradouro: formData.nome_logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        municipio: formData.municipio || null,
        codigo_ibge_municipio: formData.codigo_ibge_municipio || null,
        uf: formData.uf || null,
        referencia: formData.referencia || null,
        
        // Rural-specific data
        codigo_imovel_rural: formData.codigo_imovel_rural || null,
        cadastro_ambiental_rural: formData.cadastro_ambiental_rural || null,
        area_total_ha: formData.area_total_ha ? parseFloat(formData.area_total_ha) : null,
        tipo_producao: formData.tipo_producao || null,
        capacidade_armazenagem_ton: formData.capacidade_armazenagem_ton ? parseFloat(formData.capacidade_armazenagem_ton) : null,
        infraestrutura: formData.infraestrutura || null,
        
        // Contact
        nome_responsavel: formData.nome_responsavel || null,
        telefone_contato: formData.telefone_contato || null,
        email_contato: formData.email_contato || null
      }

      if (editingFazenda) {
        const { error } = await supabase
          .from("fazendas")
          .update(fazendaData)
          .eq("id", editingFazenda.id)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Fazenda atualizada com sucesso!",
        })
      } else {
        const { error } = await supabase
          .from("fazendas")
          .insert(fazendaData)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Fazenda criada com sucesso!",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadFazendas()
    } catch (error) {
      console.error("Erro ao salvar fazenda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a fazenda.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (fazenda: Fazenda) => {
    setEditingFazenda(fazenda)
    setFormData({
      nome: fazenda.nome,
      endereco: fazenda.endereco,
      cidade: fazenda.cidade || "",
      estado: fazenda.estado || "",
      cep: fazenda.cep || "",
      latitude: fazenda.latitude?.toString() || "",
      longitude: fazenda.longitude?.toString() || "",
      ativo: fazenda.ativo,
      
      // Fiscal identification
      inscricao_estadual: fazenda.inscricao_estadual || "",
      uf_ie: fazenda.uf_ie || "",
      cpf_cnpj_proprietario: fazenda.cpf_cnpj_proprietario || "",
      situacao_cadastral: fazenda.situacao_cadastral || "ativa",
      
      // Location and Address
      tipo_logradouro: fazenda.tipo_logradouro || "",
      nome_logradouro: fazenda.nome_logradouro || "",
      numero: fazenda.numero || "",
      complemento: fazenda.complemento || "",
      bairro: fazenda.bairro || "",
      municipio: fazenda.municipio || "",
      codigo_ibge_municipio: fazenda.codigo_ibge_municipio || "",
      uf: fazenda.uf || "",
      referencia: fazenda.referencia || "",
      
      // Rural-specific data
      codigo_imovel_rural: fazenda.codigo_imovel_rural || "",
      cadastro_ambiental_rural: fazenda.cadastro_ambiental_rural || "",
      area_total_ha: fazenda.area_total_ha?.toString() || "",
      tipo_producao: fazenda.tipo_producao || "",
      capacidade_armazenagem_ton: fazenda.capacidade_armazenagem_ton?.toString() || "",
      infraestrutura: fazenda.infraestrutura || "",
      
      // Contact
      nome_responsavel: fazenda.nome_responsavel || "",
      telefone_contato: fazenda.telefone_contato || "",
      email_contato: fazenda.email_contato || ""
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fazenda?")) return

    try {
      const { error } = await supabase
        .from("fazendas")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast({
        title: "Sucesso",
        description: "Fazenda excluída com sucesso!",
      })
      loadFazendas()
    } catch (error) {
      console.error("Erro ao excluir fazenda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a fazenda.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Fazendas</h1>
          <p className="text-muted-foreground">Gerencie suas propriedades rurais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Fazenda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFazenda ? "Editar Fazenda" : "Nova Fazenda"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Fazenda *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Fazenda São José"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Endereço principal"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Fazenda ativa</Label>
                </div>
              </div>

              {/* Fiscal Identification */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Identificação Fiscal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      value={formData.inscricao_estadual}
                      onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                      placeholder="000.000.000.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf_ie">UF da IE</Label>
                    <Input
                      id="uf_ie"
                      value={formData.uf_ie}
                      onChange={(e) => setFormData({ ...formData, uf_ie: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj_proprietario">CPF/CNPJ Proprietário</Label>
                    <Input
                      id="cpf_cnpj_proprietario"
                      value={formData.cpf_cnpj_proprietario}
                      onChange={(e) => setFormData({ ...formData, cpf_cnpj_proprietario: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="situacao_cadastral">Situação Cadastral</Label>
                    <Input
                      id="situacao_cadastral"
                      value={formData.situacao_cadastral}
                      onChange={(e) => setFormData({ ...formData, situacao_cadastral: e.target.value })}
                      placeholder="ativa"
                    />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Localização Detalhada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_logradouro">Tipo de Logradouro</Label>
                    <Input
                      id="tipo_logradouro"
                      value={formData.tipo_logradouro}
                      onChange={(e) => setFormData({ ...formData, tipo_logradouro: e.target.value })}
                      placeholder="Fazenda, Sítio, Estrada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_logradouro">Nome do Logradouro</Label>
                    <Input
                      id="nome_logradouro"
                      value={formData.nome_logradouro}
                      onChange={(e) => setFormData({ ...formData, nome_logradouro: e.target.value })}
                      placeholder="Nome da rua/estrada"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="S/N ou número"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Km, Gleba, Galpão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro/Distrito</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Zona Rural"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Município</Label>
                    <Input
                      id="municipio"
                      value={formData.municipio}
                      onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                      placeholder="Nome do município"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_ibge_municipio">Código IBGE</Label>
                    <Input
                      id="codigo_ibge_municipio"
                      value={formData.codigo_ibge_municipio}
                      onChange={(e) => setFormData({ ...formData, codigo_ibge_municipio: e.target.value })}
                      placeholder="0000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={formData.uf}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="-23.5489"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="-46.6388"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referência</Label>
                    <Input
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                      placeholder="Ponto de referência"
                    />
                  </div>
                </div>
              </div>

              {/* Rural Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Dados Rurais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo_imovel_rural">Código Imóvel Rural (NIRF)</Label>
                    <Input
                      id="codigo_imovel_rural"
                      value={formData.codigo_imovel_rural}
                      onChange={(e) => setFormData({ ...formData, codigo_imovel_rural: e.target.value })}
                      placeholder="000.000.000.000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cadastro_ambiental_rural">Cadastro Ambiental Rural (CAR)</Label>
                    <Input
                      id="cadastro_ambiental_rural"
                      value={formData.cadastro_ambiental_rural}
                      onChange={(e) => setFormData({ ...formData, cadastro_ambiental_rural: e.target.value })}
                      placeholder="SP-0000000-AAAA.AAAA.AAAA-AAAA"
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
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidade_armazenagem_ton">Capacidade Armazenagem (ton)</Label>
                    <Input
                      id="capacidade_armazenagem_ton"
                      type="number"
                      step="0.01"
                      value={formData.capacidade_armazenagem_ton}
                      onChange={(e) => setFormData({ ...formData, capacidade_armazenagem_ton: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_producao">Tipo de Produção</Label>
                    <Input
                      id="tipo_producao"
                      value={formData.tipo_producao}
                      onChange={(e) => setFormData({ ...formData, tipo_producao: e.target.value })}
                      placeholder="Soja, Milho, Café, Gado"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infraestrutura">Infraestrutura</Label>
                  <Input
                    id="infraestrutura"
                    value={formData.infraestrutura}
                    onChange={(e) => setFormData({ ...formData, infraestrutura: e.target.value })}
                    placeholder="Armazém próprio, secador, oficina"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
                    <Input
                      id="nome_responsavel"
                      value={formData.nome_responsavel}
                      onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_contato">Telefone</Label>
                    <Input
                      id="telefone_contato"
                      value={formData.telefone_contato}
                      onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_contato">E-mail</Label>
                    <Input
                      id="email_contato"
                      type="email"
                      value={formData.email_contato}
                      onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                      placeholder="contato@fazenda.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFazenda ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {fazendas.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma fazenda cadastrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece cadastrando sua primeira propriedade rural
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Cadastrar Fazenda
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>CEP</TableHead>
                <TableHead>Coordenadas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fazendas.map((fazenda) => (
                <TableRow key={fazenda.id}>
                  <TableCell className="font-medium">{fazenda.nome}</TableCell>
                  <TableCell>{fazenda.endereco}</TableCell>
                  <TableCell>
                    {[fazenda.cidade, fazenda.estado].filter(Boolean).join(" - ") || "-"}
                  </TableCell>
                  <TableCell>{fazenda.cep || "-"}</TableCell>
                  <TableCell>
                    {(fazenda.latitude && fazenda.longitude) 
                      ? `${fazenda.latitude.toFixed(4)}, ${fazenda.longitude.toFixed(4)}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={fazenda.ativo ? "default" : "secondary"}>
                      {fazenda.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(fazenda)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(fazenda.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}