import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{`Produto: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="horizontal"
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 120,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="produto" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
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
        </div>
      </CardContent>
    </Card>
  );
};