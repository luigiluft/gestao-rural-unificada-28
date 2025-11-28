import { useState, useEffect } from "react"
import { Plus, Building2, Users, Edit, Building, Tractor } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useClientes, useCreateCliente, useUpdateCliente, Cliente } from "@/hooks/useClientes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GerenciarDepositos } from "@/components/Clientes/GerenciarDepositos"
import { GerenciarLocaisEntrega } from "@/components/Clientes/GerenciarLocaisEntrega"
import { useCliente } from "@/contexts/ClienteContext"
import { SolicitarFilialDialog } from "@/components/Empresas/SolicitarFilialDialog"

export default function Empresas() {
  const { data: clientes, isLoading } = useClientes()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const { setAvailableClientes } = useCliente()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [empresaMatriz, setEmpresaMatriz] = useState<Cliente | null>(null) // Para adicionar filial
  const [solicitarFilialOpen, setSolicitarFilialOpen] = useState(false) // Dialog de solicitação
  
  const [formData, setFormData] = useState({
    tipo_cliente: 'cnpj' as 'cpf' | 'cnpj',
    razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
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
    empresa_matriz_id: undefined as string | undefined,
  })

  const [semNumero, setSemNumero] = useState(false)
  const [semComplemento, setSemComplemento] = useState(false)

  // Atualizar lista de clientes disponíveis no contexto
  useEffect(() => {
    if (clientes) {
      setAvailableClientes(clientes)
    }
  }, [clientes, setAvailableClientes])

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
      tipo_cliente: 'cnpj',
      razao_social: '',
      nome_fantasia: '',
      cpf_cnpj: '',
      inscricao_estadual: '',
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
      empresa_matriz_id: undefined,
    })
    setSemNumero(false)
    setSemComplemento(false)
    setEmpresaMatriz(null)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      tipo_cliente: cliente.tipo_cliente,
      razao_social: cliente.razao_social,
      nome_fantasia: cliente.nome_fantasia || '',
      cpf_cnpj: cliente.cpf_cnpj,
      inscricao_estadual: cliente.inscricao_estadual || '',
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
      empresa_matriz_id: undefined,
    })
    setSemNumero(cliente.numero_fiscal === 'S/N')
    setSemComplemento(cliente.complemento_fiscal === 'S/C')
    setIsDialogOpen(true)
  }

  const handleAdicionarFilial = (matriz: Cliente) => {
    setEmpresaMatriz(matriz)
    setFormData({
      tipo_cliente: 'cnpj',
      razao_social: '',
      nome_fantasia: '',
      cpf_cnpj: '',
      inscricao_estadual: '',
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
      empresa_matriz_id: matriz.id,
    })
    setSemNumero(false)
    setSemComplemento(false)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div className="p-8">Carregando empresas...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
          <p className="text-muted-foreground">
            Entidades fiscais (pessoas físicas e jurídicas)
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCliente(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Empresa' : empresaMatriz ? 'Nova Filial' : 'Nova Empresa'}
              </DialogTitle>
              <DialogDescription>
                {empresaMatriz 
                  ? `Adicionar filial da empresa: ${empresaMatriz.razao_social} (${empresaMatriz.cpf_cnpj})`
                  : 'Cadastre uma nova entidade fiscal (pessoa física ou jurídica)'
                }
              </DialogDescription>
            </DialogHeader>
            
            {empresaMatriz && (
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Empresa Matriz:</span>
                  <span>{empresaMatriz.razao_social}</span>
                  <Badge variant="outline">{empresaMatriz.cpf_cnpj}</Badge>
                </div>
              </div>
            )}
            
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
                      onValueChange={(value: 'cpf' | 'cnpj') =>
                        setFormData({ ...formData, tipo_cliente: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                        <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="razao_social">
                      {formData.tipo_cliente === 'cpf' ? 'Nome Completo *' : 'Razão Social *'}
                    </Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) =>
                        setFormData({ ...formData, razao_social: e.target.value })
                      }
                      required
                    />
                  </div>

                  {formData.tipo_cliente === 'cnpj' && (
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
                  )}

                  <div>
                    <Label htmlFor="cpf_cnpj">
                      {formData.tipo_cliente === 'cpf' ? 'CPF *' : 'CNPJ *'}
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

                  {formData.tipo_cliente === 'cnpj' && (
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
                  )}
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
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="numero_fiscal">Número</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="sem-numero"
                            checked={semNumero}
                            onCheckedChange={(checked) => {
                              setSemNumero(checked)
                              if (checked) {
                                setFormData({ ...formData, numero_fiscal: 'S/N' })
                              } else {
                                setFormData({ ...formData, numero_fiscal: '' })
                              }
                            }}
                          />
                          <Label htmlFor="sem-numero" className="text-sm text-muted-foreground cursor-pointer">
                            Sem número
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="numero_fiscal"
                        value={semNumero ? 'S/N' : formData.numero_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, numero_fiscal: e.target.value })
                        }
                        disabled={semNumero}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="complemento_fiscal">Complemento</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="sem-complemento"
                            checked={semComplemento}
                            onCheckedChange={(checked) => {
                              setSemComplemento(checked)
                              if (checked) {
                                setFormData({ ...formData, complemento_fiscal: 'S/C' })
                              } else {
                                setFormData({ ...formData, complemento_fiscal: '' })
                              }
                            }}
                          />
                          <Label htmlFor="sem-complemento" className="text-sm text-muted-foreground cursor-pointer">
                            Sem complemento
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="complemento_fiscal"
                        value={semComplemento ? 'S/C' : formData.complemento_fiscal}
                        onChange={(e) =>
                          setFormData({ ...formData, complemento_fiscal: e.target.value })
                        }
                        disabled={semComplemento}
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

                  {formData.tipo_cliente === 'cnpj' && (
                    <>
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
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="lucro_real">Lucro Real</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

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
                <Badge variant={cliente.tipo_cliente === 'cnpj' ? 'default' : 'secondary'}>
                  {cliente.tipo_cliente === 'cnpj' ? 'CNPJ' : 'CPF'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">
                    {cliente.tipo_cliente === 'cnpj' ? 'CNPJ:' : 'CPF:'}
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

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(cliente)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {cliente.tipo_cliente === 'cnpj' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEmpresaMatriz(cliente)
                      setSolicitarFilialOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Solicitar Filial
                  </Button>
                )}
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCliente(cliente)}
                >
                  {cliente.tipo_cliente === 'cnpj' ? (
                    <>
                      <Building className="h-4 w-4 mr-1" />
                      Depósitos
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

      {clientes?.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro cliente (pessoa física ou jurídica)
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Cliente
          </Button>
        </Card>
      )}

      <Dialog 
        open={!!selectedCliente} 
        onOpenChange={(open) => !open && setSelectedCliente(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCliente?.tipo_cliente === 'cnpj' ? 'Gerenciar Depósitos' : 'Gerenciar Fazendas'}
            </DialogTitle>
            <DialogDescription>
              {selectedCliente?.tipo_cliente === 'cnpj' 
                ? 'Gerencie os depósitos desta empresa' 
                : 'Gerencie os locais de entrega deste produtor rural (fazendas, filiais, etc)'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            selectedCliente.tipo_cliente === 'cnpj' ? (
              <GerenciarDepositos clienteId={selectedCliente.id} />
            ) : (
              <GerenciarLocaisEntrega clienteId={selectedCliente.id} produtorId={selectedCliente.created_by || ''} />
            )
          )}
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!selectedClienteId} 
        onOpenChange={(open) => !open && setSelectedClienteId(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuários da Empresa</DialogTitle>
            <DialogDescription>
              Adicione ou remova usuários desta empresa
            </DialogDescription>
          </DialogHeader>
          {selectedClienteId && (
            <div className="p-4">
              <p className="text-muted-foreground">
                Funcionalidade de gerenciar usuários em desenvolvimento
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SolicitarFilialDialog
        open={solicitarFilialOpen}
        onOpenChange={setSolicitarFilialOpen}
        empresaMatriz={empresaMatriz ? { id: empresaMatriz.id, razao_social: empresaMatriz.razao_social } : { id: "", razao_social: "" }}
      />
    </div>
  )
}
