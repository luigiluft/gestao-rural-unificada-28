import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, Check, X, Plus, ArrowLeft } from "lucide-react"
import { useClientesDestinatarios } from "@/hooks/useClientesDestinatarios"
import { useClienteByCpfCnpj } from "@/hooks/useClienteByCpfCnpj"
import { useCreateCliente } from "@/hooks/useClientes"
import { useCreateEmpresaCliente } from "@/hooks/useEmpresaClientes"
import { useCliente } from "@/contexts/ClienteContext"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ClienteDestinatarioSelectorProps {
  value: string | undefined
  onChange: (clienteId: string) => void
}

type Mode = 'select' | 'search' | 'register'

export function ClienteDestinatarioSelector({ value, onChange }: ClienteDestinatarioSelectorProps) {
  const [mode, setMode] = useState<Mode>('select')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  
  // Form state for registration
  const [formData, setFormData] = useState({
    razao_social: '',
    telefone_comercial: '',
    email_comercial: '',
    inscricao_estadual: '',
    endereco_fiscal: '',
    numero_fiscal: '',
    bairro_fiscal: '',
    cidade_fiscal: '',
    estado_fiscal: '',
    cep_fiscal: '',
  })

  const { selectedCliente } = useCliente()
  const { data: clientesDestinatarios = [], refetch: refetchClientes } = useClientesDestinatarios()
  const { data: clienteEncontrado, isLoading: buscandoCliente } = useClienteByCpfCnpj(cpfCnpj)
  const createCliente = useCreateCliente()
  const createEmpresaCliente = useCreateEmpresaCliente()

  // Clean CPF/CNPJ for validation
  const cleanCpfCnpj = cpfCnpj.replace(/[^\d]/g, '')
  const isValidLength = cleanCpfCnpj.length === 11 || cleanCpfCnpj.length === 14
  const isCnpj = cleanCpfCnpj.length === 14

  // Check if found client is already linked
  const clienteJaVinculado = clienteEncontrado && clientesDestinatarios.some(c => c.id === clienteEncontrado.id)

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__new__') {
      setMode('search')
      setCpfCnpj('')
    } else {
      onChange(selectedValue)
    }
  }

  const handleLinkCliente = async () => {
    if (!clienteEncontrado || !selectedCliente?.id) return
    
    setIsLinking(true)
    try {
      // Verificar diretamente no banco se já existe vínculo (segurança extra)
      const { data: jaExiste } = await supabase
        .from("empresa_clientes")
        .select("id")
        .eq("empresa_id", selectedCliente.id)
        .eq("cliente_id", clienteEncontrado.id)
        .maybeSingle()

      if (jaExiste || clienteJaVinculado) {
        // Já existe vínculo, apenas selecionar
        onChange(clienteEncontrado.id)
        setMode('select')
        setCpfCnpj('')
        toast.success('Cliente selecionado!')
        return
      }
      
      // Não existe, criar vínculo
      await createEmpresaCliente.mutateAsync({
        empresa_id: selectedCliente.id,
        cliente_id: clienteEncontrado.id,
        tipo_relacionamento: 'cliente'
      })
      
      await refetchClientes()
      onChange(clienteEncontrado.id)
      setMode('select')
      setCpfCnpj('')
      toast.success('Cliente vinculado com sucesso!')
    } catch (error) {
      console.error('Erro ao vincular cliente:', error)
      toast.error('Erro ao vincular cliente')
    } finally {
      setIsLinking(false)
    }
  }

  const handleRegisterCliente = async () => {
    if (!selectedCliente?.id) {
      toast.error('Selecione uma empresa primeiro')
      return
    }

    if (!formData.razao_social.trim()) {
      toast.error('Razão Social é obrigatória')
      return
    }

    try {
      // Create the client
      const novoCliente = await createCliente.mutateAsync({
        cpf_cnpj: cleanCpfCnpj,
        razao_social: formData.razao_social,
        tipo_cliente: isCnpj ? 'cnpj' : 'cpf',
        nome_fantasia: formData.razao_social,
        telefone_comercial: formData.telefone_comercial || null,
        email_comercial: formData.email_comercial || null,
        inscricao_estadual: formData.inscricao_estadual || null,
        endereco_fiscal: formData.endereco_fiscal || null,
        numero_fiscal: formData.numero_fiscal || null,
        complemento_fiscal: null,
        bairro_fiscal: formData.bairro_fiscal || null,
        cidade_fiscal: formData.cidade_fiscal || null,
        estado_fiscal: formData.estado_fiscal || null,
        cep_fiscal: formData.cep_fiscal || null,
        atividade_principal: null,
        regime_tributario: null,
        observacoes: null,
      })

      // Link to current empresa
      await createEmpresaCliente.mutateAsync({
        empresa_id: selectedCliente.id,
        cliente_id: novoCliente.id,
        tipo_relacionamento: 'cliente'
      })

      await refetchClientes()
      onChange(novoCliente.id)
      setMode('select')
      setCpfCnpj('')
      setFormData({
        razao_social: '',
        telefone_comercial: '',
        email_comercial: '',
        inscricao_estadual: '',
        endereco_fiscal: '',
        numero_fiscal: '',
        bairro_fiscal: '',
        cidade_fiscal: '',
        estado_fiscal: '',
        cep_fiscal: '',
      })
      toast.success('Cliente cadastrado e vinculado com sucesso!')
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error('Erro ao cadastrar cliente')
    }
  }

  const handleBack = () => {
    setMode('select')
    setCpfCnpj('')
  }

  // Mode: Select from existing
  if (mode === 'select') {
    return (
      <div className="space-y-2">
        <Label htmlFor="cliente_destinatario_id">Cliente Destinatário *</Label>
        <Select value={value || ''} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione ou busque cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientesDestinatarios.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.razao_social} ({cliente.cpf_cnpj})
              </SelectItem>
            ))}
            <SelectItem value="__new__">
              <span className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                Buscar / Cadastrar Novo Cliente
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Mode: Search by CPF/CNPJ
  if (mode === 'search') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Label>Buscar Cliente por CPF/CNPJ</Label>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Digite o CPF ou CNPJ"
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {buscandoCliente && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!buscandoCliente && isValidLength && clienteEncontrado && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {!buscandoCliente && isValidLength && !clienteEncontrado && (
              <X className="h-4 w-4 text-destructive" />
            )}
            {!buscandoCliente && !isValidLength && cpfCnpj.length > 0 && (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isValidLength && clienteEncontrado && (
          <Card className={clienteJaVinculado ? "border-blue-500/50 bg-blue-500/5" : "border-green-500/50 bg-green-500/5"}>
            <CardContent className="p-3">
              <p className={`text-sm font-medium ${clienteJaVinculado ? "text-blue-700 dark:text-blue-400" : "text-green-700 dark:text-green-400"}`}>
                {clienteJaVinculado ? "Cliente já vinculado à sua empresa" : "Cliente encontrado na plataforma"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {clienteEncontrado.razao_social}
              </p>
              <Button 
                size="sm" 
                className="mt-2" 
                onClick={handleLinkCliente}
                disabled={isLinking}
              >
                {isLinking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {clienteJaVinculado ? "Selecionar" : "Usar este cliente"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Not found */}
        {isValidLength && !buscandoCliente && !clienteEncontrado && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-3">
              <p className="text-sm font-medium text-destructive">
                Cliente não encontrado na plataforma
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2" 
                onClick={() => setMode('register')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar novo cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Mode: Register new client
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setMode('search')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Label>Cadastro Rápido de Cliente</Label>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">CPF/CNPJ</Label>
              <Input value={cpfCnpj} disabled className="bg-muted" />
            </div>
            
            <div className="col-span-2">
              <Label className="text-xs">Razão Social / Nome *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>

            {isCnpj && (
              <div className="col-span-2">
                <Label className="text-xs">Inscrição Estadual</Label>
                <Input
                  value={formData.inscricao_estadual}
                  onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  placeholder="Inscrição estadual"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                value={formData.telefone_comercial}
                onChange={(e) => setFormData({ ...formData, telefone_comercial: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={formData.email_comercial}
                onChange={(e) => setFormData({ ...formData, email_comercial: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label className="text-xs">CEP</Label>
              <Input
                value={formData.cep_fiscal}
                onChange={(e) => setFormData({ ...formData, cep_fiscal: e.target.value })}
                placeholder="00000-000"
              />
            </div>

            <div>
              <Label className="text-xs">Endereço</Label>
              <Input
                value={formData.endereco_fiscal}
                onChange={(e) => setFormData({ ...formData, endereco_fiscal: e.target.value })}
                placeholder="Rua, Av..."
              />
            </div>

            <div>
              <Label className="text-xs">Número</Label>
              <Input
                value={formData.numero_fiscal}
                onChange={(e) => setFormData({ ...formData, numero_fiscal: e.target.value })}
                placeholder="Nº"
              />
            </div>

            <div>
              <Label className="text-xs">Bairro</Label>
              <Input
                value={formData.bairro_fiscal}
                onChange={(e) => setFormData({ ...formData, bairro_fiscal: e.target.value })}
                placeholder="Bairro"
              />
            </div>

            <div>
              <Label className="text-xs">Cidade</Label>
              <Input
                value={formData.cidade_fiscal}
                onChange={(e) => setFormData({ ...formData, cidade_fiscal: e.target.value })}
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label className="text-xs">UF</Label>
              <Input
                value={formData.estado_fiscal}
                onChange={(e) => setFormData({ ...formData, estado_fiscal: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setMode('search')}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleRegisterCliente}
              disabled={createCliente.isPending || !formData.razao_social.trim()}
            >
              {createCliente.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cadastrar e Selecionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
