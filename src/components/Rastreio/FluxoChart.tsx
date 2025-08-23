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
    color: "#3b82f6", // blue-500
  },
  noDeposito: {
    label: "No Depósito", 
    color: "#f97316", // orange-500
  },
  emSeparacao: {
    label: "Em Separação",
    color: "#eab308", // yellow-500
  },
  expedido: {
    label: "Expedido",
    color: "#10b981", // green-500
  },
  entregue: {
    label: "Entregue",
    color: "#8b5cf6", // purple-500
  },
} as const;

export const FluxoChart = ({ data }: FluxoChartProps) => {
  console.log("FluxoChart - Received data:", data);
  
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
              layout="horizontal"
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 80,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                type="category"
                dataKey="produto" 
                tick={{ fontSize: 12 }}
                width={120}
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
                fill="#3b82f6"
                name="A Caminho"
              />
              <Bar
                dataKey="noDeposito"
                stackId="a"
                fill="#f97316"
                name="No Depósito"
              />
              <Bar
                dataKey="emSeparacao"
                stackId="a"
                fill="#eab308"
                name="Em Separação"
              />
              <Bar
                dataKey="expedido"
                stackId="a"
                fill="#10b981"
                name="Expedido"
              />
              <Bar
                dataKey="entregue"
                stackId="a"
                fill="#8b5cf6"
                name="Entregue"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};