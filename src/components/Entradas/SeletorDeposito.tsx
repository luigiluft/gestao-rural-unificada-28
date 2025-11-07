import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useDepositosDisponiveis } from "@/hooks/useDepositosDisponiveis"
import { useAuth } from "@/contexts/AuthContext"

interface SeletorDepositoProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function SeletorDeposito({ value, onValueChange, disabled }: SeletorDepositoProps) {
  const { user } = useAuth()
  const { data: depositos, isLoading } = useDepositosDisponiveis(user?.id)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Depósito</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="deposito">Depósito de Destino</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um depósito" />
        </SelectTrigger>
        <SelectContent>
          {depositos?.map((item) => (
            <SelectItem key={item.deposito_id} value={item.deposito_id}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.deposito_nome}</span>
                  {item.tipo_deposito === 'filial' && (
                    <Badge variant="secondary" className="text-xs">Filial</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.tipo_deposito === 'franquia' 
                    ? `Franqueado: ${item.franqueado_nome}`
                    : 'Operado pela Matriz'
                  }
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {depositos?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum depósito disponível.
        </p>
      )}
    </div>
  )
}