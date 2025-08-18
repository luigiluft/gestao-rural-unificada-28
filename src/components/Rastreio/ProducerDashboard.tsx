import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Warehouse, Package, TrendingUp } from "lucide-react"

interface DashboardStats {
  entradasEmTransito: number
  itensNoEstoque: number
  saidasEmAndamento: number
  valorTotalEstoque: number
}

interface ProducerDashboardProps {
  stats: DashboardStats
}

export const ProducerDashboard = ({ stats }: ProducerDashboardProps) => {
  const cards = [
    {
      title: "A Caminho",
      value: stats.entradasEmTransito,
      icon: Truck,
      description: "entradas em trânsito",
      color: "text-blue-600"
    },
    {
      title: "No Estoque",
      value: stats.itensNoEstoque,
      icon: Warehouse,
      description: "itens armazenados",
      color: "text-green-600"
    },
    {
      title: "Saindo",
      value: stats.saidasEmAndamento,
      icon: Package,
      description: "saídas em andamento",
      color: "text-orange-600"
    },
    {
      title: "Valor em Estoque",
      value: `R$ ${stats.valorTotalEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: "valor total",
      color: "text-purple-600",
      isValue: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.isValue ? card.value : card.value.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}