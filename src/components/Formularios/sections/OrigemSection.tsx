import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin } from "lucide-react"
import { DadosSaida } from "../types/formulario.types"
import { useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/contexts/AuthContext"
import { useCliente } from "@/contexts/ClienteContext"
import { useDepositosDisponiveis, useDepositosFranqueado, useTodasFranquias } from "@/hooks/useDepositosDisponiveis"
import { useMemo, useEffect } from "react"

interface OrigemSectionProps {
  dados: DadosSaida
  onDadosChange: (dados: DadosSaida) => void
}

export function OrigemSection({ dados, onDadosChange }: OrigemSectionProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { selectedCliente } = useCliente()

  // Hooks condicionais baseados no papel do usuário
  const { data: depositosProdutor = [] } = useDepositosDisponiveis(
    profile?.role === 'cliente' ? user?.id : undefined
  )
  const { data: franquiasFranqueado = [] } = useDepositosFranqueado()
  const { data: todasFranquias = [] } = useTodasFranquias()

  // Normalizar dados para formato consistente
  const depositos = useMemo(() => {
    if (profile?.role === 'admin') {
      return todasFranquias.map(franquia => ({
        deposito_id: franquia.id,
        deposito_nome: franquia.nome,
        endereco: franquia.endereco || '',
        cidade: franquia.cidade || '',
        estado: franquia.estado || ''
      }))
    } else if (franquiasFranqueado && franquiasFranqueado.length > 0) {
      return franquiasFranqueado.map(franquia => ({
        deposito_id: franquia.id,
        deposito_nome: franquia.nome,
        endereco: franquia.endereco || '',
        cidade: franquia.cidade || '',
        estado: franquia.estado || ''
      }))
    } else if (profile?.role === 'cliente') {
      return depositosProdutor || []
    }
    return []
  }, [profile?.role, todasFranquias, franquiasFranqueado, depositosProdutor])

  // Auto-select deposit if only one available
  useEffect(() => {
    if (depositos.length === 1 && !dados.depositoId) {
      onDadosChange({ ...dados, depositoId: depositos[0].deposito_id })
    }
  }, [depositos, dados.depositoId])

  const depositoSelecionado = depositos.find(d => d.deposito_id === dados.depositoId)

  const handleChange = (campo: keyof DadosSaida, valor: string) => {
    onDadosChange({ ...dados, [campo]: valor })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Origem (Depósito e Faturamento)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Depósito de Origem */}
          <div className="space-y-2">
            <Label htmlFor="deposito_id">Depósito de Origem *</Label>
            {depositos.length === 1 ? (
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <span>{depositos[0].deposito_nome}</span>
              </div>
            ) : (
              <Select value={dados.depositoId} onValueChange={(value) => handleChange('depositoId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o depósito" />
                </SelectTrigger>
                <SelectContent>
                  {depositos.map((deposito) => (
                    <SelectItem key={deposito.deposito_id} value={deposito.deposito_id}>
                      {deposito.deposito_nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Endereço de Faturamento (da empresa selecionada no header) */}
          <div className="space-y-2">
            <Label>Endereço de Faturamento</Label>
            {selectedCliente ? (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium">{selectedCliente.razao_social}</p>
                <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    {selectedCliente.endereco_fiscal && `${selectedCliente.endereco_fiscal}, `}
                    {selectedCliente.numero_fiscal}
                    {selectedCliente.bairro_fiscal && ` - ${selectedCliente.bairro_fiscal}`}
                    <br />
                    {selectedCliente.cidade_fiscal}/{selectedCliente.estado_fiscal}
                    {selectedCliente.cep_fiscal && ` - CEP: ${selectedCliente.cep_fiscal}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CNPJ: {selectedCliente.cpf_cnpj}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Selecione uma empresa no menu superior
                </p>
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
