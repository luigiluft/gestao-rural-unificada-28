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
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{`Produto: ${label}`}</p>
        <p className="text-sm font-medium mb-1">{`Total: ${total} unidades`}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const percentage = ((entry.value / total) * 100).toFixed(1);
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.name}: ${entry.value} (${percentage}%)`}
              </p>
            );
          })}
        </div>
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
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 80,
              }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="produto" 
                tick={{ fontSize: 11, textAnchor: 'end' }}
                height={80}
                interval={0}
                angle={-45}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar 
                dataKey="aCaminho" 
                stackId="fluxo" 
                fill="#2563eb" 
                name="A Caminho"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="noDeposito" 
                stackId="fluxo" 
                fill="#059669" 
                name="No Depósito"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="emSeparacao" 
                stackId="fluxo" 
                fill="#d97706" 
                name="Em Separação"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="expedido" 
                stackId="fluxo" 
                fill="#ea580c" 
                name="Expedido"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="entregue" 
                stackId="fluxo" 
                fill="#7c3aed" 
                name="Entregue"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};