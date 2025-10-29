import { Box, Package, Grid3X3, Calculator } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface WarehouseStatsProps {
  stats: {
    total: number
    ocupadas: number
    livres: number
    ocupacaoPercentual: number
  }
}

export function WarehouseStats({ stats }: WarehouseStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Posições</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Package className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posições Ocupadas</p>
              <p className="text-2xl font-bold">{stats.ocupadas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Grid3X3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posições Livres</p>
              <p className="text-2xl font-bold">{stats.livres}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
              <p className="text-2xl font-bold">{stats.ocupacaoPercentual}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
