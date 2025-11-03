import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { useWMSFluxo } from "@/hooks/useWMSFluxo"
import { LoadingState } from "@/components/ui/loading-state"
import { EmptyState } from "@/components/ui/empty-state"

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "hsl(var(--chart-1))",
  },
  saidas: {
    label: "Saídas",
    color: "hsl(var(--chart-2))",
  },
}

export const StatusFluxoChart = () => {
  const { data: fluxoData, isLoading } = useWMSFluxo()

  if (isLoading) {
    return <LoadingState />
  }

  if (!fluxoData || fluxoData.every(item => item.total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo por Status</CardTitle>
          <CardDescription>
            Distribuição de entradas e saídas por status no armazém
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nenhum dado disponível"
            description="Quando houver movimentações, elas aparecerão neste gráfico"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo por Status</CardTitle>
        <CardDescription>
          Distribuição de entradas e saídas por status no armazém
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fluxoData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="status" 
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="rect"
              />
              <Bar 
                dataKey="entradas" 
                fill="var(--color-entradas)" 
                name="Entradas"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="saidas" 
                fill="var(--color-saidas)" 
                name="Saídas"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
