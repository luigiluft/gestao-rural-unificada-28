import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTodasFranquias } from "@/hooks/useDepositosDisponiveis"
import { useAuth } from "@/contexts/AuthContext"

interface SeletorDepositoProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function SeletorDeposito({ value, onValueChange, disabled }: SeletorDepositoProps) {
  const { user } = useAuth()
  const { data: depositos, isLoading } = useTodasFranquias()

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
          {depositos?.map((franquia) => (
            <SelectItem key={franquia.id} value={franquia.id}>
              <div className="flex flex-col">
                <span>{franquia.nome}</span>
                <span className="text-sm text-muted-foreground">
                  {franquia.cidade}, {franquia.estado}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {depositos?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma franquia disponível.
        </p>
      )}
    </div>
  )
}