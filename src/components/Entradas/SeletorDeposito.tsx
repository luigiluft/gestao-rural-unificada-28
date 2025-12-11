import { useEffect } from "react"
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

  // Auto-select if only one deposit
  useEffect(() => {
    if (depositos?.length === 1 && !value) {
      onValueChange(depositos[0].deposito_id)
    }
  }, [depositos, value, onValueChange])

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
      {depositos?.length === 1 ? (
        <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
          <span>{depositos[0].deposito_nome}</span>
          {depositos[0].tipo_deposito === 'filial' && (
            <Badge variant="secondary" className="text-xs ml-2">Filial</Badge>
          )}
          {depositos[0].tipo_deposito === 'armazem_geral' && (
            <Badge variant="outline" className="text-xs ml-2">Armazém Geral</Badge>
          )}
        </div>
      ) : (
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
                    {item.tipo_deposito === 'armazem_geral' && (
                      <Badge variant="outline" className="text-xs">Armazém Geral</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.franqueado_nome}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {depositos?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum depósito disponível.
        </p>
      )}
    </div>
  )
}