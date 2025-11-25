import { Building2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { useFranquia } from "@/contexts/FranquiaContext"
import { Badge } from "./badge"

export function DepositoFilter() {
  const { selectedFranquia, setSelectedFranquia, availableFranquias } = useFranquia()

  // Don't show filter if only one deposit
  if (availableFranquias.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
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
          <SelectValue placeholder="Selecione o depósito" />
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
