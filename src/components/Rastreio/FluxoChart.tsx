import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

interface FluxoData {
  produto: string;
  aCaminho: number;
  noDeposito: number;
  emSeparacao: number;
  expedido: number;
  entregue: number;
}

interface FluxoChartProps {
  data: FluxoData[];
}

const chartConfig = {
  aCaminho: {
    label: "A Caminho",
    color: "hsl(217, 91%, 60%)", // blue-500
  },
  noDeposito: {
    label: "No Depósito", 
    color: "hsl(25, 95%, 53%)", // orange-500
  },
  emSeparacao: {
    label: "Em Separação",
    color: "hsl(45, 93%, 47%)", // yellow-500
  },
  expedido: {
    label: "Expedido",
    color: "hsl(142, 76%, 36%)", // green-600
  },
  entregue: {
    label: "Entregue",
    color: "hsl(262, 83%, 58%)", // purple-500
  },
} as const;

export const FluxoChart = ({ data }: FluxoChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fluxo de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Fluxo de Produtos por Etapa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualização das quantidades de produtos em cada etapa do processo logístico
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="min-h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="produto" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              
              <Bar
                dataKey="aCaminho"
                stackId="a"
                fill="var(--color-aCaminho)"
                name="A Caminho"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="noDeposito"
                stackId="a"
                fill="var(--color-noDeposito)"
                name="No Depósito"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="emSeparacao"
                stackId="a"
                fill="var(--color-emSeparacao)"
                name="Em Separação"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="expedido"
                stackId="a"
                fill="var(--color-expedido)"
                name="Expedido"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="entregue"
                stackId="a"
                fill="var(--color-entregue)"
                name="Entregue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};