import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Calculator, Building2, Box, Layers } from "lucide-react";

export interface WarehouseLayout {
  ruas: number;
  modulos: number;
  andares: number;
  capacidade_por_posicao: number;
  posicoes_inativas: Array<{
    rua: number;
    modulo: number;
    andar: number;
  }>;
  capacidade_total_calculada: number;
}

interface WarehouseLayoutDesignerProps {
  layout?: WarehouseLayout | null;
  onLayoutChange: (layout: WarehouseLayout) => void;
  onCapacityChange: (capacity: number) => void;
}

const DEFAULT_LAYOUT: WarehouseLayout = {
  ruas: 4,
  modulos: 10,
  andares: 4,
  capacidade_por_posicao: 1.2,
  posicoes_inativas: [],
  capacidade_total_calculada: 192
};

export function WarehouseLayoutDesigner({ 
  layout, 
  onLayoutChange, 
  onCapacityChange 
}: WarehouseLayoutDesignerProps) {
  const [currentLayout, setCurrentLayout] = useState<WarehouseLayout>(layout || DEFAULT_LAYOUT);

  // Notificar o pai com o layout padrão se nenhum foi fornecido
  useEffect(() => {
    if (!layout) {
      const defaultWithCapacity = {
        ...DEFAULT_LAYOUT,
        capacidade_total_calculada: DEFAULT_LAYOUT.ruas * DEFAULT_LAYOUT.modulos * DEFAULT_LAYOUT.andares * DEFAULT_LAYOUT.capacidade_por_posicao
      };
      onLayoutChange(defaultWithCapacity);
      onCapacityChange(defaultWithCapacity.capacidade_total_calculada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcular capacidade total
  const calculateCapacity = (layout: WarehouseLayout) => {
    const totalPositions = layout.ruas * layout.modulos * layout.andares;
    const activePositions = totalPositions - layout.posicoes_inativas.length;
    return activePositions * layout.capacidade_por_posicao;
  };

  // Atualizar layout
  const updateLayout = (updates: Partial<WarehouseLayout>) => {
    const newLayout = { 
      ...currentLayout, 
      ...updates,
      posicoes_inativas: [] // Resetar posições inativas quando dimensões mudam
    };
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Reset layout para valores padrão
  const resetLayout = () => {
    const newLayout = { ...DEFAULT_LAYOUT };
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  useEffect(() => {
    if (layout) {
      setCurrentLayout(layout);
    }
  }, [layout]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Designer de Layout do Armazém
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dimensions Configuration */}
          <div className="space-y-6">
            {/* Dimensões do Armazém */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Dimensões do Armazém
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLayout}
                  className="h-8 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Resetar
                </Button>
              </div>

              {/* Slider para Ruas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Número de Ruas</Label>
                  <Badge variant="secondary">{currentLayout.ruas}</Badge>
                </div>
                <Slider
                  value={[currentLayout.ruas]}
                  onValueChange={(value) => updateLayout({ ruas: value[0] })}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              {/* Slider para Módulos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Módulos por Rua</Label>
                  <Badge variant="secondary">{currentLayout.modulos}</Badge>
                </div>
                <Slider
                  value={[currentLayout.modulos]}
                  onValueChange={(value) => updateLayout({ modulos: value[0] })}
                  min={1}
                  max={250}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>250</span>
                </div>
              </div>

              {/* Slider para Andares */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Número de Andares</Label>
                  <Badge variant="secondary">{currentLayout.andares}</Badge>
                </div>
                <Slider
                  value={[currentLayout.andares]}
                  onValueChange={(value) => updateLayout({ andares: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Capacidade por Posição */}
              <div className="space-y-2">
                <Label className="text-sm">Capacidade por Posição (toneladas)</Label>
                <Input
                  type="number"
                  value={currentLayout.capacidade_por_posicao}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      updateLayout({ capacidade_por_posicao: value });
                    }
                  }}
                  step={0.1}
                  min={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Padrão: 1.2t por posição de pallet
                </p>
              </div>
            </div>

            {/* Estatísticas do Layout */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium">Estatísticas do Layout</h4>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {currentLayout.ruas.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Ruas</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {currentLayout.modulos.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Módulos</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {currentLayout.andares.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Andares</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {(currentLayout.ruas * currentLayout.modulos * currentLayout.andares - currentLayout.posicoes_inativas.length).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Posições Totais</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Posições Ativas</span>
                      <Badge variant="default" className="text-lg px-4 py-1">
                        {(currentLayout.ruas * currentLayout.modulos * currentLayout.andares - currentLayout.posicoes_inativas.length).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Posições Inativas</span>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {currentLayout.posicoes_inativas.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Capacidade Total
                      </span>
                      <Badge variant="outline" className="text-lg px-4 py-1 font-bold">
                        {currentLayout.capacidade_total_calculada.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })}t
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
