import { Warehouse } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { useFranquia } from "@/contexts/FranquiaContext"
import { useDeposito } from "@/contexts/DepositoContext"
import { useUserRole } from "@/hooks/useUserRole"
import { Badge } from "./badge"

export function DepositoFilter() {
  const { isCliente } = useUserRole()
  const depositoContext = useDeposito()
  const franquiaContext = useFranquia()

  // Para clientes, usar DepositoContext
  if (isCliente) {
    const { selectedDeposito, setSelectedDeposito, availableDepositos } = depositoContext

    // Don't show filter if only one deposit
    if (availableDepositos.length <= 1) {
      return null
    }

    return (
      <div className="flex items-center gap-2">
        <Warehouse className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedDeposito?.id || "ALL"}
          onValueChange={(id) => {
            const deposito = availableDepositos.find(d => d.id === id)
            if (deposito) {
              setSelectedDeposito(deposito)
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione o depósito" />
          </SelectTrigger>
          <SelectContent>
            {availableDepositos.map((deposito) => (
              <SelectItem key={deposito.id} value={deposito.id}>
                {deposito.id === "ALL" ? (
                  <span className="flex items-center gap-2">
                    📦 {deposito.nome}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    🏢 {deposito.nome}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedDeposito && selectedDeposito.id !== "ALL" && (
          <Badge variant="outline" className="text-xs">
            Filtrando
          </Badge>
        )}
      </div>
    )
  }

  // Para não-clientes, usar FranquiaContext
  const { selectedFranquia, setSelectedFranquia, availableFranquias } = franquiaContext

  // Don't show filter if only one deposit
  if (availableFranquias.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Warehouse className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedFranquia?.id || "ALL"}
        onValueChange={(id) => {
          const deposito = availableFranquias.find(f => f.id === id)
          if (deposito) {
            setSelectedFranquia(deposito)
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione a franquia" />
        </SelectTrigger>
        <SelectContent>
          {availableFranquias.map((deposito) => (
            <SelectItem key={deposito.id} value={deposito.id}>
              {deposito.id === "ALL" ? (
                <span className="flex items-center gap-2">
                  📦 {deposito.nome}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  🏢 {deposito.nome}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedFranquia && selectedFranquia.id !== "ALL" && (
        <Badge variant="outline" className="text-xs">
          Filtrando
        </Badge>
      )}
    </div>
  )
}
