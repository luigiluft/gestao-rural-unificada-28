import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, User, Truck, Building2 } from "lucide-react"
import { DadosSaida } from "../types/formulario.types"
import { useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { useLocaisEntrega } from "@/hooks/useLocaisEntrega"
import { ClienteDestinatarioSelector } from "../components/ClienteDestinatarioSelector"
import { useDepositosFranqueado } from "@/hooks/useDepositosDisponiveis"
import { useEffect } from "react"

interface DestinatarioEntregaSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function DestinatarioEntregaSection({ dados, onDadosChange }: DestinatarioEntregaSectionProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: franquiasFranqueado = [] } = useDepositosFranqueado()
  
  const isCliente = profile?.role === 'cliente'
  const hasFranchiseAccess = franquiasFranqueado && franquiasFranqueado.length > 0

  // Buscar locais de entrega do cliente destinatário
  const { data: locaisEntrega = [], isLoading: loadingLocais } = useLocaisEntrega(dados.cliente_destinatario_id)

  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  // Auto-preencher endereço quando local de entrega é selecionado
  useEffect(() => {
    if (dados.local_entrega_id && locaisEntrega.length > 0) {
      const local = locaisEntrega.find(l => l.id === dados.local_entrega_id)
      if (local) {
        onDadosChange({
          ...dados,
          entrega_logradouro: (local as any).logradouro || local.endereco || '',
          entrega_numero: (local as any).numero || '',
          entrega_complemento: (local as any).complemento || '',
          entrega_bairro: (local as any).bairro || '',
          entrega_municipio: local.cidade || '',
          entrega_uf: local.estado || '',
          entrega_cep: local.cep || ''
        })
      }
    }
  }, [dados.local_entrega_id, locaisEntrega])

  const localSelecionado = locaisEntrega.find(l => l.id === dados.local_entrega_id)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Destinatário e Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cliente Destinatário */}
        {(isCliente || hasFranchiseAccess) && (
          <ClienteDestinatarioSelector
            value={dados.cliente_destinatario_id}
            onChange={(clienteId) => handleChange('cliente_destinatario_id', clienteId)}
          />
        )}

        {/* Tipo de Saída */}
        <div className="space-y-2">
          <Label htmlFor="tipo_saida">Tipo de Saída *</Label>
          <Select value={dados.tipo_saida} onValueChange={(value) => handleChange('tipo_saida', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retirada_deposito">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Retirada no Depósito
                </div>
              </SelectItem>
              <SelectItem value="entrega_fazenda">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Entrega no Destinatário
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Local de Entrega - aparece quando tipo = entrega_fazenda E há cliente destinatário */}
        {dados.tipo_saida === 'entrega_fazenda' && dados.cliente_destinatario_id && (
          <div className="space-y-2">
            <Label htmlFor="local_entrega_id">Local de Entrega *</Label>
            {loadingLocais ? (
              <div className="h-10 flex items-center text-sm text-muted-foreground">
                Carregando locais...
              </div>
            ) : locaisEntrega.length === 0 ? (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Nenhum local de entrega cadastrado para este cliente
                </p>
              </div>
            ) : (
              <Select 
                value={dados.local_entrega_id || ''} 
                onValueChange={(value) => handleChange('local_entrega_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local de entrega" />
                </SelectTrigger>
                <SelectContent>
                  {locaisEntrega.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {local.nome} - {local.cidade}/{local.estado}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Endereço de Entrega (auto-preenchido) */}
        {dados.tipo_saida === 'entrega_fazenda' && localSelecionado && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <Label className="text-xs text-muted-foreground mb-2 block">Endereço de Entrega</Label>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{localSelecionado.nome}</p>
                <p className="text-muted-foreground">
                  {localSelecionado.endereco || (localSelecionado as any).logradouro || ''}
                </p>
                <p className="text-muted-foreground">
                  {localSelecionado.cidade}/{localSelecionado.estado}
                  {(localSelecionado as any).cep && ` - CEP: ${(localSelecionado as any).cep}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info para retirada no depósito */}
        {dados.tipo_saida === 'retirada_deposito' && (
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              O cliente irá retirar a mercadoria no depósito de origem
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
