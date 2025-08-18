import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Calculator, Eye, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  layout?: WarehouseLayout;
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
  const [selectedPosition, setSelectedPosition] = useState<{rua: number; modulo: number; andar: number} | null>(null);
  const [viewAngle, setViewAngle] = useState(0);

  // Calcular capacidade total
  const calculateCapacity = (layout: WarehouseLayout) => {
    const totalPositions = layout.ruas * layout.modulos * layout.andares;
    const activePositions = totalPositions - layout.posicoes_inativas.length;
    return activePositions * layout.capacidade_por_posicao;
  };

  // Verificar se posição está inativa
  const isPositionInactive = (rua: number, modulo: number, andar: number) => {
    return currentLayout.posicoes_inativas.some(
      pos => pos.rua === rua && pos.modulo === modulo && pos.andar === andar
    );
  };

  // Toggle status da posição
  const togglePosition = (rua: number, modulo: number, andar: number) => {
    const newLayout = { ...currentLayout };
    const isInactive = isPositionInactive(rua, modulo, andar);
    
    if (isInactive) {
      newLayout.posicoes_inativas = newLayout.posicoes_inativas.filter(
        pos => !(pos.rua === rua && pos.modulo === modulo && pos.andar === andar)
      );
    } else {
      newLayout.posicoes_inativas.push({ rua, modulo, andar });
    }
    
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Atualizar dimensões
  const updateDimensions = (field: keyof WarehouseLayout, value: number) => {
    const newLayout = { 
      ...currentLayout, 
      [field]: value,
      posicoes_inativas: [] // Reset posições inativas ao mudar dimensões
    };
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Atualizar layout quando prop layout mudar
  useEffect(() => {
    if (layout && layout !== currentLayout) {
      setCurrentLayout(layout);
    }
  }, [layout]);

  // Reset para configuração padrão
  const resetLayout = () => {
    const newLayout = { ...DEFAULT_LAYOUT };
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Renderizar visualização 3D/isométrica do armazém
  const renderWarehouseView = () => {
    const scale = Math.min(400 / Math.max(currentLayout.ruas, currentLayout.modulos), 30);
    const baseWidth = currentLayout.modulos * scale;
    const baseHeight = currentLayout.ruas * scale;
    
    return (
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg overflow-hidden" 
           style={{ width: '100%', height: '450px' }}>
        <div className="absolute inset-4 flex items-center justify-center">
          <div 
            className="relative transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `perspective(1200px) rotateX(60deg) rotateY(${viewAngle}deg) scale(0.7)`,
              transformOrigin: 'center center'
            }}
          >
            {/* Base do armazém */}
            <div 
              className="relative border-2 border-primary/30 bg-background/10 shadow-2xl"
              style={{ 
                width: `${baseWidth}px`, 
                height: `${baseHeight}px`,
              }}
            >
              {/* Grid de posições */}
              {Array.from({ length: currentLayout.ruas }).map((_, ruaIndex) => (
                Array.from({ length: currentLayout.modulos }).map((_, moduloIndex) => (
                  <div
                    key={`${ruaIndex}-${moduloIndex}`}
                    className="absolute"
                    style={{
                      left: `${(moduloIndex * scale)}px`,
                      top: `${(ruaIndex * scale)}px`,
                      width: `${scale - 1}px`,
                      height: `${scale - 1}px`,
                    }}
                  >
                    {/* Stack de andares */}
                    {Array.from({ length: currentLayout.andares }).map((_, andarIndex) => {
                      const isInactive = isPositionInactive(ruaIndex + 1, moduloIndex + 1, andarIndex + 1);
                      const floorHeight = 8;
                      const floorOffset = andarIndex * floorHeight;
                      const shadowIntensity = (currentLayout.andares - andarIndex) * 0.1;
                      
                      return (
                        <div
                          key={andarIndex}
                          className={cn(
                            "absolute cursor-pointer transition-all duration-300 hover:brightness-110 border-2",
                            isInactive 
                              ? "bg-red-500/70 border-red-400 shadow-red-500/30" 
                              : "bg-emerald-500/80 border-emerald-400 shadow-emerald-500/40"
                          )}
                          style={{
                            left: `${andarIndex * 1}px`,
                            bottom: `${floorOffset}px`,
                            width: `${scale - 6 - andarIndex * 1}px`,
                            height: `${scale - 6 - andarIndex * 1}px`,
                            zIndex: andarIndex + 1,
                            boxShadow: `
                              0 ${floorHeight}px ${floorHeight * 2}px rgba(0,0,0,${shadowIntensity}),
                              0 0 0 1px rgba(255,255,255,0.1),
                              inset 0 1px 0 rgba(255,255,255,0.2)
                            `,
                            transform: `translateZ(${andarIndex * 2}px)`,
                          }}
                          onClick={() => togglePosition(ruaIndex + 1, moduloIndex + 1, andarIndex + 1)}
                          title={`Rua ${ruaIndex + 1}, Módulo ${moduloIndex + 1}, Andar ${andarIndex + 1}`}
                        >
                          {/* Indicador do número do andar */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold opacity-70 pointer-events-none"
                            style={{ fontSize: `${Math.max(6, scale/6)}px` }}
                          >
                            {andarIndex + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ))}
            </div>
            
            {/* Etiquetas de ruas */}
            {Array.from({ length: currentLayout.ruas }).map((_, index) => (
              <div
                key={`rua-${index}`}
                className="absolute text-xs font-bold text-foreground/70 -left-8"
                style={{ top: `${index * scale + scale/2 - 6}px` }}
              >
                R{index + 1}
              </div>
            ))}
            
            {/* Etiquetas de módulos */}
            {Array.from({ length: currentLayout.modulos }).map((_, index) => (
              <div
                key={`modulo-${index}`}
                className="absolute text-xs font-bold text-foreground/70 -top-6"
                style={{ left: `${index * scale + scale/2 - 6}px` }}
              >
                M{index + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Controles de rotação */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAngle(prev => prev - 15)}
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAngle(prev => prev + 15)}
          >
            →
          </Button>
        </div>
        
        {/* Legenda */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-primary/60 border border-primary/80 rounded-sm"></div>
            <span className="text-foreground/70">Posição Ativa</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-destructive/40 border border-destructive/60 rounded-sm"></div>
            <span className="text-foreground/70">Posição Inativa</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Designer de Layout do Armazém
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              {currentLayout.capacidade_total_calculada.toFixed(1)}t
            </Badge>
            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="configurar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configurar" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurar
            </TabsTrigger>
            <TabsTrigger value="visualizar" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configurar" className="space-y-6">
            {/* Controles de Dimensões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Número de Ruas</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.ruas]}
                    onValueChange={([value]) => updateDimensions('ruas', value)}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.ruas}</span>
                    <span>20</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Módulos por Rua</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.modulos]}
                    onValueChange={([value]) => updateDimensions('modulos', value)}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.modulos}</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Número de Andares</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.andares]}
                    onValueChange={([value]) => updateDimensions('andares', value)}
                    max={8}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.andares}</span>
                    <span>8</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacidade por Posição */}
            <div className="space-y-3">
              <Label htmlFor="capacidade-posicao">Capacidade por Posição (toneladas)</Label>
              <Input
                id="capacidade-posicao"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={currentLayout.capacidade_por_posicao}
                onChange={(e) => updateDimensions('capacidade_por_posicao', parseFloat(e.target.value) || 0.1)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Padrão: 1.2t por posição de pallet
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentLayout.ruas * currentLayout.modulos * currentLayout.andares}
                </div>
                <div className="text-xs text-muted-foreground">Posições Totais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {(currentLayout.ruas * currentLayout.modulos * currentLayout.andares) - currentLayout.posicoes_inativas.length}
                </div>
                <div className="text-xs text-muted-foreground">Posições Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {currentLayout.posicoes_inativas.length}
                </div>
                <div className="text-xs text-muted-foreground">Posições Inativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentLayout.capacidade_total_calculada.toFixed(1)}t
                </div>
                <div className="text-xs text-muted-foreground">Capacidade Total</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualizar" className="space-y-4">
            {renderWarehouseView()}
            <p className="text-xs text-center text-muted-foreground">
              Clique nas posições para ativar/desativar • Use as setas para rotacionar a visualização
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}