import { useState, useEffect, useCallback } from "react"
import { Plus, Building2, Users, Edit, Trash2, Search, UserPlus, Loader2, CheckCircle } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClientes, useCreateCliente, Cliente } from "@/hooks/useClientes"
import { useEmpresaClientes, useCreateEmpresaCliente, useRemoveEmpresaCliente, EmpresaCliente } from "@/hooks/useEmpresaClientes"
import { useCliente } from "@/contexts/ClienteContext"
import { useClienteByCpfCnpj } from "@/hooks/useClienteByCpfCnpj"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Clientes() {
  const { selectedCliente: empresaSelecionada } = useCliente()
  const { data: minhasEmpresas, isLoading: loadingEmpresas } = useClientes()
  const { data: empresaClientes, isLoading: loadingClientes } = useEmpresaClientes(empresaSelecionada?.id)
  const createCliente = useCreateCliente()
  const createEmpresaCliente = useCreateEmpresaCliente()
  const removeEmpresaCliente = useRemoveEmpresaCliente()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isVincularDialogOpen, setIsVincularDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteToRemove, setClienteToRemove] = useState<EmpresaCliente | null>(null)
  const [selectedExistingCliente, setSelectedExistingCliente] = useState<string>("")
  const [cpfCnpjBusca, setCpfCnpjBusca] = useState<string>("")
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)

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
  })

  const [semNumero, setSemNumero] = useState(false)
  const [semComplemento, setSemComplemento] = useState(false)

  // Hook para buscar cliente existente por CPF/CNPJ
  const { data: clienteExistente, isLoading: buscandoCliente } = useClienteByCpfCnpj(cpfCnpjBusca)

  // Efeito para quando encontrar um cliente existente
  useEffect(() => {
    if (clienteExistente && cpfCnpjBusca) {
      setClienteEncontrado(clienteExistente)
      // Preencher formulário com dados do cliente encontrado
      setFormData({
        tipo_cliente: clienteExistente.tipo_cliente as 'cpf' | 'cnpj',
        razao_social: clienteExistente.razao_social || '',
        nome_fantasia: clienteExistente.nome_fantasia || '',
        cpf_cnpj: clienteExistente.cpf_cnpj || '',
        inscricao_estadual: clienteExistente.inscricao_estadual || '',
        endereco_fiscal: clienteExistente.endereco_fiscal || '',
        numero_fiscal: clienteExistente.numero_fiscal || '',
        complemento_fiscal: clienteExistente.complemento_fiscal || '',
        bairro_fiscal: clienteExistente.bairro_fiscal || '',
        cidade_fiscal: clienteExistente.cidade_fiscal || '',
        estado_fiscal: clienteExistente.estado_fiscal || '',
        cep_fiscal: clienteExistente.cep_fiscal || '',
        telefone_comercial: clienteExistente.telefone_comercial || '',
        email_comercial: clienteExistente.email_comercial || '',
        atividade_principal: clienteExistente.atividade_principal || '',
        regime_tributario: clienteExistente.regime_tributario || '',
        observacoes: clienteExistente.observacoes || '',
      })
      setSemNumero(clienteExistente.numero_fiscal === 'S/N')
      setSemComplemento(clienteExistente.complemento_fiscal === 'S/C')
    }
  }, [clienteExistente, cpfCnpjBusca])

  // Debounce para busca de CPF/CNPJ
  const handleCpfCnpjChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, cpf_cnpj: value }))
    setClienteEncontrado(null)
    
    // Limpar formatação para busca
    const cleanValue = value.replace(/[^\d]/g, '')
    if (cleanValue.length >= 11) {
      setCpfCnpjBusca(cleanValue)
    } else {
      setCpfCnpjBusca("")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaSelecionada) return

    // Se encontrou um cliente existente, apenas vincular
    if (clienteEncontrado) {
      createEmpresaCliente.mutate({
        empresa_id: empresaSelecionada.id,
        cliente_id: clienteEncontrado.id,
        tipo_relacionamento: 'cliente',
      }, {
        onSuccess: () => {
          toast.success("Cliente vinculado com sucesso!")
          setIsDialogOpen(false)
          resetForm()
        }
      })
      return
    }

    // Criar o cliente e vincular à empresa
    createCliente.mutate(formData, {
      onSuccess: (novoCliente) => {
        // Vincular à empresa selecionada
        createEmpresaCliente.mutate({
          empresa_id: empresaSelecionada.id,
          cliente_id: novoCliente.id,
          tipo_relacionamento: 'cliente',
        })
        setIsDialogOpen(false)
        resetForm()
      }
    })
  }

  const handleVincularExistente = () => {
    if (!empresaSelecionada || !selectedExistingCliente) return

    createEmpresaCliente.mutate({
      empresa_id: empresaSelecionada.id,
      cliente_id: selectedExistingCliente,
      tipo_relacionamento: 'cliente',
    }, {
      onSuccess: () => {
        setIsVincularDialogOpen(false)
        setSelectedExistingCliente("")
      }
    })
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
    })
    setSemNumero(false)
    setSemComplemento(false)
    setCpfCnpjBusca("")
    setClienteEncontrado(null)
  }

  const handleRemoveCliente = () => {
    if (clienteToRemove) {
      removeEmpresaCliente.mutate(clienteToRemove.id)
      setClienteToRemove(null)
    }
  }

  // Filtrar clientes já vinculados para não mostrar no select
  const clientesVinculadosIds = empresaClientes?.map(ec => ec.cliente_id) || []
  const clientesDisponiveis = minhasEmpresas?.filter(c => 
    !clientesVinculadosIds.includes(c.id) && 
    c.id !== empresaSelecionada?.id
  ) || []

  // Filtrar por busca
  const filteredClientes = empresaClientes?.filter(ec => {
    const cliente = ec.cliente
    const searchLower = searchTerm.toLowerCase()
    return (
      cliente.razao_social.toLowerCase().includes(searchLower) ||
      cliente.cpf_cnpj.includes(searchTerm) ||
      (cliente.nome_fantasia?.toLowerCase().includes(searchLower))
    )
  })

  if (loadingEmpresas || loadingClientes) {
    return <div className="p-8">Carregando...</div>
  }

  if (!empresaSelecionada) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Selecione uma Empresa</h2>
          <p className="text-muted-foreground">
            Para gerenciar clientes, primeiro selecione uma empresa no seletor do cabeçalho.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Clientes da empresa: <span className="font-medium">{empresaSelecionada.razao_social}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isVincularDialogOpen} onOpenChange={setIsVincularDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Vincular Existente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular Cliente Existente</DialogTitle>
                <DialogDescription>
                  Selecione um cliente já cadastrado para vincular a esta empresa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedExistingCliente} onValueChange={setSelectedExistingCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesDisponiveis.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.razao_social} ({cliente.cpf_cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsVincularDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleVincularExistente} disabled={!selectedExistingCliente}>
                    Vincular
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo cliente para {empresaSelecionada.razao_social}
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
                      <Label htmlFor="tipo_cliente">Tipo *</Label>
                      <Select
                        value={formData.tipo_cliente}
                        onValueChange={(value: 'cpf' | 'cnpj') =>
                          setFormData({ ...formData, tipo_cliente: value, cpf_cnpj: '' })
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
                      <Label htmlFor="cpf_cnpj">
                        {formData.tipo_cliente === 'cpf' ? 'CPF *' : 'CNPJ *'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="cpf_cnpj"
                          value={formData.cpf_cnpj}
                          onChange={(e) => handleCpfCnpjChange(e.target.value)}
                          placeholder={formData.tipo_cliente === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          required
                          className={clienteEncontrado ? "border-green-500 pr-10" : ""}
                        />
                        {buscandoCliente && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {clienteEncontrado && !buscandoCliente && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {clienteEncontrado && (
                        <Alert className="mt-2 border-green-500 bg-green-50 dark:bg-green-950">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription className="text-green-700 dark:text-green-300">
                            Cliente já cadastrado na plataforma! Os dados foram preenchidos automaticamente.
                            Ao salvar, ele será vinculado à sua empresa.
                          </AlertDescription>
                        </Alert>
                      )}
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
                        disabled={!!clienteEncontrado}
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
                          disabled={!!clienteEncontrado}
                        />
                      </div>
                    )}

                    {formData.tipo_cliente === 'cnpj' && (
                      <div>
                        <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                        <Input
                          id="inscricao_estadual"
                          value={formData.inscricao_estadual}
                          onChange={(e) =>
                            setFormData({ ...formData, inscricao_estadual: e.target.value })
                          }
                          disabled={!!clienteEncontrado}
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
                                setFormData({ ...formData, numero_fiscal: checked ? 'S/N' : '' })
                              }}
                            />
                            <Label htmlFor="sem-numero" className="text-sm text-muted-foreground cursor-pointer">
                              S/N
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
                                setFormData({ ...formData, complemento_fiscal: checked ? 'S/C' : '' })
                              }}
                            />
                            <Label htmlFor="sem-complemento" className="text-sm text-muted-foreground cursor-pointer">
                              S/C
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
                      <Label htmlFor="telefone_comercial">Telefone</Label>
                      <Input
                        id="telefone_comercial"
                        value={formData.telefone_comercial}
                        onChange={(e) =>
                          setFormData({ ...formData, telefone_comercial: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="email_comercial">Email</Label>
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
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCliente.isPending || createEmpresaCliente.isPending}
                  >
                    {(createCliente.isPending || createEmpresaCliente.isPending) 
                      ? 'Salvando...' 
                      : clienteEncontrado 
                        ? 'Vincular Cliente' 
                        : 'Salvar'
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ/CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {!filteredClientes || filteredClientes.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum cliente cadastrado</h2>
          <p className="text-muted-foreground mb-4">
            Comece cadastrando os clientes de {empresaSelecionada.razao_social}
          </p>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Cliente
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((ec) => {
            const cliente = ec.cliente
            return (
              <Card key={ec.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {cliente.tipo_cliente === 'cpf' ? (
                        <Users className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold line-clamp-1">
                        {cliente.nome_fantasia || cliente.razao_social}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cliente.cpf_cnpj}
                      </p>
                      {cliente.cidade_fiscal && cliente.estado_fiscal && (
                        <p className="text-xs text-muted-foreground">
                          {cliente.cidade_fiscal}/{cliente.estado_fiscal}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={cliente.tipo_cliente === 'cnpj' ? 'default' : 'secondary'}>
                      {cliente.tipo_cliente.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setClienteToRemove(ec)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Alert Dialog para remover cliente */}
      <AlertDialog open={!!clienteToRemove} onOpenChange={() => setClienteToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {clienteToRemove?.cliente.razao_social} da lista de clientes de {empresaSelecionada?.razao_social}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveCliente}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
