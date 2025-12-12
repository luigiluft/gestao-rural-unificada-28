import { useState } from "react"
import { useCreateEmbarque } from "@/hooks/useEmbarques"
import { useClienteDepositos } from "@/hooks/useClienteDepositos"
import { useCliente } from "@/contexts/ClienteContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, MapPin, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface NovoEmbarqueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canCollect: boolean
}

interface Destino {
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  contato?: string
  telefone?: string
}

export default function NovoEmbarqueDialog({ open, onOpenChange, canCollect }: NovoEmbarqueDialogProps) {
  const { selectedCliente } = useCliente()
  const { data: depositos } = useClienteDepositos(selectedCliente?.id)
  const createEmbarque = useCreateEmbarque()

  const [tipoOrigem, setTipoOrigem] = useState<'BASE_PROPRIA' | 'COLETA'>('BASE_PROPRIA')
  const [origemDepositoId, setOrigemDepositoId] = useState<string>("")
  const [origemEndereco, setOrigemEndereco] = useState({
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    contato: "",
    telefone: "",
  })
  const [destinos, setDestinos] = useState<Destino[]>([{
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    contato: "",
    telefone: "",
  }])
  const [pesoTotal, setPesoTotal] = useState("")
  const [quantidadeVolumes, setQuantidadeVolumes] = useState("")
  const [observacoes, setObservacoes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createEmbarque.mutateAsync({
      tipo_origem: tipoOrigem,
      origem_deposito_id: tipoOrigem === 'BASE_PROPRIA' ? origemDepositoId || null : null,
      origem_endereco: tipoOrigem === 'COLETA' ? origemEndereco : null,
      destinos: destinos.map((d, index) => ({
        endereco: {
          logradouro: d.logradouro,
          numero: d.numero,
          bairro: d.bairro,
          cidade: d.cidade,
          estado: d.estado,
          cep: d.cep,
        },
        contato: d.contato,
        telefone: d.telefone,
        ordem: index + 1,
      })),
      peso_total: pesoTotal ? parseFloat(pesoTotal) : null,
      quantidade_volumes: quantidadeVolumes ? parseInt(quantidadeVolumes) : null,
      observacoes: observacoes || null,
    })

    // Reset form
    setTipoOrigem('BASE_PROPRIA')
    setOrigemDepositoId("")
    setOrigemEndereco({ logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", contato: "", telefone: "" })
    setDestinos([{ logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", contato: "", telefone: "" }])
    setPesoTotal("")
    setQuantidadeVolumes("")
    setObservacoes("")
    onOpenChange(false)
  }

  const addDestino = () => {
    setDestinos([...destinos, { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", contato: "", telefone: "" }])
  }

  const removeDestino = (index: number) => {
    if (destinos.length > 1) {
      setDestinos(destinos.filter((_, i) => i !== index))
    }
  }

  const updateDestino = (index: number, field: keyof Destino, value: string) => {
    const updated = [...destinos]
    updated[index] = { ...updated[index], [field]: value }
    setDestinos(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Embarque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Origem */}
          <div className="space-y-3">
            <Label>Tipo de Origem</Label>
            <RadioGroup
              value={tipoOrigem}
              onValueChange={(v) => setTipoOrigem(v as 'BASE_PROPRIA' | 'COLETA')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BASE_PROPRIA" id="base" />
                <Label htmlFor="base" className="flex items-center gap-1 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Base Própria
                </Label>
              </div>
              {canCollect && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COLETA" id="coleta" />
                  <Label htmlFor="coleta" className="flex items-center gap-1 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    Coleta
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Origem - Base Própria */}
          {tipoOrigem === 'BASE_PROPRIA' && (
            <div className="space-y-2">
              <Label>Depósito de Origem</Label>
              <Select value={origemDepositoId} onValueChange={setOrigemDepositoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o depósito" />
                </SelectTrigger>
                <SelectContent>
                  {depositos?.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Origem - Coleta */}
          {tipoOrigem === 'COLETA' && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm font-medium">Endereço de Coleta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={origemEndereco.logradouro}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, logradouro: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={origemEndereco.numero}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, numero: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={origemEndereco.cep}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, cep: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={origemEndereco.cidade}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, cidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={origemEndereco.estado}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, estado: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>Contato</Label>
                    <Input
                      value={origemEndereco.contato}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, contato: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={origemEndereco.telefone}
                      onChange={(e) => setOrigemEndereco({ ...origemEndereco, telefone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Destinos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Destinos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDestino}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Destino
              </Button>
            </div>
            
            {destinos.map((destino, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Destino {index + 1}</p>
                    {destinos.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDestino(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Logradouro</Label>
                      <Input
                        value={destino.logradouro}
                        onChange={(e) => updateDestino(index, 'logradouro', e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={destino.numero}
                        onChange={(e) => updateDestino(index, 'numero', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={destino.cep}
                        onChange={(e) => updateDestino(index, 'cep', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={destino.cidade}
                        onChange={(e) => updateDestino(index, 'cidade', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input
                        value={destino.estado}
                        onChange={(e) => updateDestino(index, 'estado', e.target.value)}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Volumes e Peso */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade de Volumes</Label>
              <Input
                type="number"
                value={quantidadeVolumes}
                onChange={(e) => setQuantidadeVolumes(e.target.value)}
                placeholder="Ex: 10"
              />
            </div>
            <div>
              <Label>Peso Total (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={pesoTotal}
                onChange={(e) => setPesoTotal(e.target.value)}
                placeholder="Ex: 500.00"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEmbarque.isPending}>
              {createEmbarque.isPending ? "Criando..." : "Criar Embarque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
