import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
        <Label>Franquia</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="deposito">Franquia de Destino</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma franquia" />
        </SelectTrigger>
        <SelectContent>
          {depositos?.map((item) => (
            <SelectItem key={item.deposito_id} value={item.deposito_id}>
              <div className="flex flex-col">
                <span>{item.deposito_nome}</span>
                <span className="text-sm text-muted-foreground">
                  Franqueado: {item.franqueado_nome}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {depositos?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma franquia disponível. Você precisa estar vinculado a um franqueado para acessar suas franquias.
        </p>
      )}
    </div>
  )
}