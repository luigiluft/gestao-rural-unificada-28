import { useState } from "react"
import { Plus, Building2, Users, Edit, Trash2, Building, Tractor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClientes, useCreateCliente, useUpdateCliente, Cliente } from "@/hooks/useClientes"
import { useClienteUsuarios } from "@/hooks/useClienteUsuarios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GerenciarDepositos } from "@/components/Clientes/GerenciarDepositos"
import { GerenciarFazendas } from "@/components/Clientes/GerenciarFazendas"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function Clientes() {
  const { data: clientes, isLoading } = useClientes()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const { user } = useAuth()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  
  const [formData, setFormData] = useState({
    tipo_cliente: 'empresa' as 'empresa' | 'produtor_rural',
    razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    endereco_fiscal: '',
    numero_fiscal: '',
    complemento_fiscal: '',
    bairro_fiscal: '',
    cidade_fiscal: '',
    estado_fiscal: '',
    cep_fiscal: '',
    telefone_comercial: '',
    email_comercial: '',
    atividade_principal: '',
    regime_tributario: '',
    observacoes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCliente) {
      updateCliente.mutate(
        { id: editingCliente.id, ...formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            setEditingCliente(null)
            resetForm()
          }
        }
      )
    } else {
      createCliente.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false)
          resetForm()
        }
      })
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_cliente: 'empresa',
      razao_social: '',
      nome_fantasia: '',
      cpf_cnpj: '',
      inscricao_estadual: '',
      inscricao_municipal: '',
      endereco_fiscal: '',
      numero_fiscal: '',
      complemento_fiscal: '',
      bairro_fiscal: '',
      cidade_fiscal: '',
      estado_fiscal: '',
      cep_fiscal: '',
      telefone_comercial: '',
      email_comercial: '',
      atividade_principal: '',
      regime_tributario: '',
      observacoes: '',
    })
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      tipo_cliente: cliente.tipo_cliente,
      razao_social: cliente.razao_social,
      nome_fantasia: cliente.nome_fantasia || '',
      cpf_cnpj: cliente.cpf_cnpj,
      inscricao_estadual: cliente.inscricao_estadual || '',
      inscricao_municipal: cliente.inscricao_municipal || '',
      endereco_fiscal: cliente.endereco_fiscal || '',
      numero_fiscal: cliente.numero_fiscal || '',
      complemento_fiscal: cliente.complemento_fiscal || '',
      bairro_fiscal: cliente.bairro_fiscal || '',
      cidade_fiscal: cliente.cidade_fiscal || '',
      estado_fiscal: cliente.estado_fiscal || '',
      cep_fiscal: cliente.cep_fiscal || '',
      telefone_comercial: cliente.telefone_comercial || '',
      email_comercial: cliente.email_comercial || '',
      atividade_principal: cliente.atividade_principal || '',
      regime_tributario: cliente.regime_tributario || '',
      observacoes: cliente.observacoes || '',
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div className="p-8">Carregando clientes...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Clientes</h1>
          <p className="text-muted-foreground">
            Entidades fiscais (empresas e produtores rurais)
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCliente(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                Cadastre uma nova entidade fiscal (empresa ou produtor rural)
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basico">Básico</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="adicional">Adicional</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4">
                  <div>
                    <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                    <Select
                      value={formData.tipo_cliente}
                      onValueChange={(value: 'empresa' | 'produtor_rural') =>
                        setFormData({ ...formData, tipo_cliente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="produtor_rural">Produtor Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) =>
                        setFormData({ ...formData, razao_social: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      value={formData.nome_fantasia}
                      onChange={(e) =>
                        setFormData({ ...formData, nome_fantasia: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf_cnpj">
                      {formData.tipo_cliente === 'empresa' ? 'CNPJ' : 'CPF/CNPJ'} *
                    </Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf_cnpj: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      value={formData.inscricao_estadual}
                      onChange={(e) =>
                        setFormData({ ...formData, inscricao_estadual: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      value={formData.inscricao_municipal}
                      onChange={(e) =>
                        setFormData({ ...formData, inscricao_municipal: e.target.value })
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4">
                  <div>
                    <Label htmlFor="cep_fiscal">CEP</Label>
                    <Input
                      id="cep_fiscal"
                      value={formData.cep_fiscal}
                      onChange={(e) =>
                        setFormData({ ...formData, cep_fiscal: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="endereco_fiscal">Endereço</Label>
                    <Input
                      id="endereco_fiscal"
                      value={formData.endereco_fiscal}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_fiscal: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numero_fiscal">Número</Label>
                      <Input
                        id="numero_fiscal"
                        value={formData.numero_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, numero_fiscal: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="complemento_fiscal">Complemento</Label>
                      <Input
                        id="complemento_fiscal"
                        value={formData.complemento_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, complemento_fiscal: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bairro_fiscal">Bairro</Label>
                    <Input
                      id="bairro_fiscal"
                      value={formData.bairro_fiscal}
                      onChange={(e) =>
                        setFormData({ ...formData, bairro_fiscal: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cidade_fiscal">Cidade</Label>
                      <Input
                        id="cidade_fiscal"
                        value={formData.cidade_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, cidade_fiscal: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado_fiscal">Estado</Label>
                      <Input
                        id="estado_fiscal"
                        value={formData.estado_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, estado_fiscal: e.target.value })
                        }
                        maxLength={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adicional" className="space-y-4">
                  <div>
                    <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
                    <Input
                      id="telefone_comercial"
                      value={formData.telefone_comercial}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone_comercial: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_comercial">Email Comercial</Label>
                    <Input
                      id="email_comercial"
                      type="email"
                      value={formData.email_comercial}
                      onChange={(e) =>
                        setFormData({ ...formData, email_comercial: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="atividade_principal">Atividade Principal</Label>
                    <Input
                      id="atividade_principal"
                      value={formData.atividade_principal}
                      onChange={(e) =>
                        setFormData({ ...formData, atividade_principal: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="regime_tributario">Regime Tributário</Label>
                    <Select
                      value={formData.regime_tributario}
                      onValueChange={(value) =>
                        setFormData({ ...formData, regime_tributario: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({ ...formData, observacoes: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingCliente(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCliente.isPending || updateCliente.isPending}>
                  {editingCliente ? 'Salvar Alterações' : 'Criar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientes?.map((cliente) => (
          <Card key={cliente.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{cliente.razao_social}</h3>
                    {cliente.nome_fantasia && (
                      <p className="text-sm text-muted-foreground">
                        {cliente.nome_fantasia}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={cliente.tipo_cliente === 'empresa' ? 'default' : 'secondary'}>
                  {cliente.tipo_cliente === 'empresa' ? 'Empresa' : 'Produtor Rural'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">
                    {cliente.tipo_cliente === 'empresa' ? 'CNPJ:' : 'CPF/CNPJ:'}
                  </span>{' '}
                  {cliente.cpf_cnpj}
                </p>
                {cliente.inscricao_estadual && (
                  <p>
                    <span className="font-medium">IE:</span> {cliente.inscricao_estadual}
                  </p>
                )}
                {cliente.telefone_comercial && (
                  <p>
                    <span className="font-medium">Tel:</span> {cliente.telefone_comercial}
                  </p>
                )}
                {cliente.email_comercial && (
                  <p>
                    <span className="font-medium">Email:</span> {cliente.email_comercial}
                  </p>
                )}
              </div>

              {cliente.papel && (
                <Badge variant="outline">
                  {cliente.papel === 'administrador' ? 'Admin' : 
                   cliente.papel === 'gestor' ? 'Gestor' :
                   cliente.papel === 'operador' ? 'Operador' : 'Visualizador'}
                </Badge>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(cliente)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCliente(cliente)}
                >
                  {cliente.tipo_cliente === 'empresa' ? (
                    <>
                      <Building className="h-4 w-4 mr-1" />
                      Filiais
                    </>
                  ) : (
                    <>
                      <Tractor className="h-4 w-4 mr-1" />
                      Fazendas
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedClienteId(cliente.id)}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(!clientes || clientes.length === 0) && (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro cliente para gerenciar suas operações
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Cliente
          </Button>
        </Card>
      )}

      {/* Dialog para gerenciar Filiais ou Fazendas */}
      <Dialog open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCliente?.tipo_cliente === 'empresa' ? 'Filiais de' : 'Fazendas de'} {selectedCliente?.razao_social}
            </DialogTitle>
          </DialogHeader>
          {selectedCliente && (
            selectedCliente.tipo_cliente === 'empresa' ? (
              <GerenciarDepositos clienteId={selectedCliente.id} />
            ) : (
              <GerenciarFazendas 
                clienteId={selectedCliente.id} 
                produtorId={user?.id || ''} 
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
