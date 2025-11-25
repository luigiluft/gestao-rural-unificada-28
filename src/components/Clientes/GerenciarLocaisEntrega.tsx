import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, MapPin, Building2, Store, Warehouse } from "lucide-react"
import { useLocaisEntrega, type TipoLocal } from "@/hooks/useLocaisEntrega"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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

interface GerenciarLocaisEntregaProps {
  clienteId: string
  produtorId?: string
}

export const GerenciarLocaisEntrega = ({ clienteId, produtorId }: GerenciarLocaisEntregaProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    tipo_local: "fazenda" as TipoLocal,
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    area_hectares: ""
  })

  const { data: locais, isLoading } = useLocaisEntrega(clienteId, produtorId)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.endereco || !formData.cidade || !formData.estado || !formData.cep) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      const { error } = await supabase
        .from("locais_entrega")
        .insert({
          nome: formData.nome,
          tipo_local: formData.tipo_local,
          is_rural: formData.tipo_local === 'fazenda',
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          area_total_ha: formData.area_hectares ? parseFloat(formData.area_hectares) : null,
          produtor_id: produtorId || null,
          cliente_id: clienteId,
          ativo: true
        })

      if (error) throw error

      toast.success("Local de entrega criado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["locais-entrega", clienteId, produtorId] })
      setFormData({
        nome: "",
        tipo_local: "fazenda",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        area_hectares: ""
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erro ao criar local de entrega:", error)
      toast.error("Erro ao criar local de entrega")
    }
  }

  const handleDelete = async (localId: string) => {
    if (!window.confirm("Deseja realmente desativar este local de entrega?")) return

    try {
      const { error } = await supabase
        .from("locais_entrega")
        .update({ ativo: false })
        .eq("id", localId)

      if (error) throw error

      toast.success("Local de entrega desativado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["locais-entrega", clienteId, produtorId] })
    } catch (error) {
      console.error("Erro ao desativar local de entrega:", error)
      toast.error("Erro ao desativar local de entrega")
    }
  }

  const TipoIcon = tipoLocalIcons[formData.tipo_local]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TipoIcon className="h-5 w-5" />
              Locais de Entrega
            </CardTitle>
            <CardDescription>
              Gerencie os endereços de entrega - fazendas, filiais, lojas, etc
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Local
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Local de Entrega</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_local">Tipo de Local *</Label>
                  <Select
                    value={formData.tipo_local}
                    onValueChange={(value: TipoLocal) => setFormData({ ...formData, tipo_local: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Local *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Fazenda Santa Maria ou Filial Centro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, complemento"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Ex: Ribeirão Preto"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="Ex: SP"
                      maxLength={2}
                      required
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

                {formData.tipo_local === 'fazenda' && (
                  <div className="space-y-2">
                    <Label htmlFor="area">Área (hectares)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      value={formData.area_hectares}
                      onChange={(e) => setFormData({ ...formData, area_hectares: e.target.value })}
                      placeholder="Ex: 150.50"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Local
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando locais de entrega...
          </div>
        ) : !locais || locais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum local de entrega cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Área (ha)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map((local) => {
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
                      {local.area_total_ha 
                        ? `${Number(local.area_total_ha).toLocaleString("pt-BR")} ha`
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(local.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}