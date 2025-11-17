import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Warehouse, Trash2, Building2 } from "lucide-react"
import { useTodasFranquias } from "@/hooks/useDepositosDisponiveis"
import { useClientes } from "@/hooks/useClientes"
import { 
  useClienteDepositos, 
  useCreateClienteDeposito, 
  useUpdateClienteDeposito,
  useDeleteClienteDeposito 
} from "@/hooks/useClienteDepositos"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface GerenciarDepositosProps {
  clienteId: string
}

export const GerenciarDepositos = ({ clienteId }: GerenciarDepositosProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    franquia_id: "",
    tipo_regime: "" as 'armazem_geral' | 'filial' | "",
    codigo_interno: "",
    endereco_complementar: "",
    contato_local: ""
  })

  const { data: depositos, isLoading } = useClienteDepositos(clienteId)
  const { data: franquias } = useTodasFranquias()
  const { data: clientes } = useClientes()
  const createDeposito = useCreateClienteDeposito()
  const deleteDeposito = useDeleteClienteDeposito()

  // Encontrar o cliente atual para verificar o tipo
  const cliente = clientes?.find(c => c.id === clienteId)
  // Cliente CPF (11 dígitos) ou produtor rural só pode ter armazém geral
  const isCPF = cliente?.tipo_cliente === 'produtor_rural' ||
                (cliente?.cpf_cnpj && cliente.cpf_cnpj.replace(/\D/g, '').length === 11)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.franquia_id || !formData.tipo_regime) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    createDeposito.mutate({
      cliente_id: clienteId,
      franquia_id: formData.franquia_id,
      tipo_regime: formData.tipo_regime,
      nome: formData.nome,
      codigo_interno: formData.codigo_interno || null,
      endereco_complementar: formData.endereco_complementar || null,
      contato_local: formData.contato_local || null
    }, {
      onSuccess: () => {
        setFormData({
          nome: "",
          franquia_id: "",
          tipo_regime: "",
          codigo_interno: "",
          endereco_complementar: "",
          contato_local: ""
        })
        setIsDialogOpen(false)
      }
    })
  }

  const handleDelete = (depositoId: string) => {
    if (window.confirm("Deseja realmente desativar este depósito?")) {
      deleteDeposito.mutate(depositoId)
    }
  }

  // Filtrar franquias que já possuem depósito deste cliente
  const franquiasDisponiveis = franquias?.filter(f => 
    !depositos?.some(dep => dep.franquia_id === f.id)
  ) || []

  const getRegimeIcon = (tipo: string) => {
    return tipo === 'armazem_geral' ? <Warehouse className="h-4 w-4" /> : <Building2 className="h-4 w-4" />
  }

  const getRegimeLabel = (tipo: string) => {
    return tipo === 'armazem_geral' ? 'Armazém Geral' : 'Filial'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Depósitos
            </CardTitle>
            <CardDescription>
              Gerencie os depósitos deste cliente {isCPF && '(Somente Armazém Geral disponível para CPF)'}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={franquiasDisponiveis.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Depósito
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Depósito</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Depósito *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Depósito São Paulo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo_interno">Código Interno</Label>
                    <Input
                      id="codigo_interno"
                      value={formData.codigo_interno}
                      onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                      placeholder="Ex: DEP-SP-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="franquia">Franquia/Filial Luft *</Label>
                    <Select
                      value={formData.franquia_id}
                      onValueChange={(value) => setFormData({ ...formData, franquia_id: value })}
                      required
                    >
                      <SelectTrigger id="franquia">
                        <SelectValue placeholder="Selecione a franquia" />
                      </SelectTrigger>
                      <SelectContent>
                        {franquiasDisponiveis.map((franquia) => (
                          <SelectItem key={franquia.id} value={franquia.id}>
                            {franquia.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_regime">Tipo de Regime *</Label>
                    <Select
                      value={formData.tipo_regime}
                      onValueChange={(value: 'armazem_geral' | 'filial') => 
                        setFormData({ ...formData, tipo_regime: value })
                      }
                      required
                    >
                      <SelectTrigger id="tipo_regime">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="armazem_geral">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            Armazém Geral
                          </div>
                        </SelectItem>
                        {!isCPF && (
                          <SelectItem value="filial">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Filial
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isCPF && (
                      <p className="text-xs text-muted-foreground">
                        Clientes CPF podem apenas ter Armazém Geral
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato_local">Contato Local</Label>
                  <Input
                    id="contato_local"
                    value={formData.contato_local}
                    onChange={(e) => setFormData({ ...formData, contato_local: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco_complementar">Endereço Complementar</Label>
                  <Textarea
                    id="endereco_complementar"
                    value={formData.endereco_complementar}
                    onChange={(e) => setFormData({ ...formData, endereco_complementar: e.target.value })}
                    placeholder="Informações adicionais sobre localização, acesso, etc."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDeposito.isPending}>
                    {createDeposito.isPending ? "Criando..." : "Criar Depósito"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando...</p>
        ) : depositos && depositos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Código Interno</TableHead>
                <TableHead>Franquia Luft</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositos.map((deposito) => (
                <TableRow key={deposito.id}>
                  <TableCell className="font-medium">{deposito.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {getRegimeIcon(deposito.tipo_regime)}
                      {getRegimeLabel(deposito.tipo_regime)}
                    </Badge>
                  </TableCell>
                  <TableCell>{deposito.codigo_interno || "-"}</TableCell>
                  <TableCell>{deposito.franquia?.nome || "-"}</TableCell>
                  <TableCell>{deposito.contato_local || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(deposito.id)}
                      disabled={deleteDeposito.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum depósito cadastrado</p>
            <p className="text-sm">Clique em "Novo Depósito" para começar</p>
          </div>
        )}

        {franquiasDisponiveis.length === 0 && depositos && depositos.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Este cliente já possui depósitos em todas as franquias disponíveis
          </p>
        )}
      </CardContent>
    </Card>
  )
}
