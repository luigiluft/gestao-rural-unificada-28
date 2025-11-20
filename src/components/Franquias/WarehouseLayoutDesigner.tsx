import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Calculator, Eye, Settings, Building2, Grid3X3, Box, Layers } from "lucide-react";
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
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [viewAngle, setViewAngle] = useState(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

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

  // Gerar chave única para posição (rua-módulo)
  const getPositionKey = (rua: number, modulo: number) => `${rua}-${modulo}`;
  
  // Verificar se algum andar da posição está inativo
  const hasInactiveFloors = (rua: number, modulo: number) => {
    return currentLayout.posicoes_inativas.some(
      pos => pos.rua === rua && pos.modulo === modulo
    );
  };

  // Toggle seleção de posição (rua-módulo)
  const togglePositionSelection = (rua: number, modulo: number) => {
    const key = getPositionKey(rua, modulo);
    const newSelected = new Set(selectedPositions);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedPositions(newSelected);
  };

  // Desativar andares específicos para posições selecionadas
  const deactivateFloorsForSelected = (floors: number[]) => {
    if (selectedPositions.size === 0) return;
    
    const newLayout = { ...currentLayout };
    
    selectedPositions.forEach(posKey => {
      const [rua, modulo] = posKey.split('-').map(Number);
      floors.forEach(andar => {
        // Verificar se já não está inativo
        const exists = newLayout.posicoes_inativas.some(
          pos => pos.rua === rua && pos.modulo === modulo && pos.andar === andar
        );
        
        if (!exists) {
          newLayout.posicoes_inativas.push({ rua, modulo, andar });
        }
      });
    });
    
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Ativar andares específicos para posições selecionadas
  const activateFloorsForSelected = (floors: number[]) => {
    if (selectedPositions.size === 0) return;
    
    const newLayout = { ...currentLayout };
    
    selectedPositions.forEach(posKey => {
      const [rua, modulo] = posKey.split('-').map(Number);
      floors.forEach(andar => {
        newLayout.posicoes_inativas = newLayout.posicoes_inativas.filter(
          pos => !(pos.rua === rua && pos.modulo === modulo && pos.andar === andar)
        );
      });
    });
    
    newLayout.capacidade_total_calculada = calculateCapacity(newLayout);
    setCurrentLayout(newLayout);
    onLayoutChange(newLayout);
    onCapacityChange(newLayout.capacidade_total_calculada);
  };

  // Renderizar vista 2D (planta baixa)
  const render2DView = () => {
    // Limite de posições para renderização (evitar travamento)
    const totalPositions = currentLayout.ruas * currentLayout.modulos;
    const MAX_POSITIONS = 5000;
    
    if (totalPositions > MAX_POSITIONS) {
      return (
        <div className="bg-muted/20 rounded-lg p-8 text-center space-y-4">
          <div className="text-destructive font-medium text-lg">
            ⚠️ Layout muito grande para visualização
          </div>
          <p className="text-sm text-muted-foreground">
            O layout configurado ({currentLayout.ruas} ruas × {currentLayout.modulos} módulos = {totalPositions.toLocaleString()} posições) 
            é muito grande para renderizar a visualização 2D. 
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, use as estatísticas na aba "Dimensões" ou configure dimensões menores para usar a interface de seleção visual.
          </p>
          <div className="pt-4">
            <Badge variant="secondary" className="text-base px-4 py-2">
              Limite máximo: {MAX_POSITIONS.toLocaleString()} posições
            </Badge>
          </div>
        </div>
      );
    }
    
    const cellSize = Math.min(400 / Math.max(currentLayout.ruas, currentLayout.modulos), 40);
    
    return (
      <div className="relative bg-gradient-to-br from-muted/10 to-muted/20 rounded-lg p-6 overflow-auto">
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="relative">
            {/* Grid de posições */}
            <div 
              className="grid gap-1 border-2 border-primary/20 p-2 bg-background/50 rounded-lg shadow-lg"
              style={{
                gridTemplateColumns: `repeat(${currentLayout.modulos}, 1fr)`,
                gridTemplateRows: `repeat(${currentLayout.ruas}, 1fr)`
              }}
            >
              {Array.from({ length: currentLayout.ruas }).map((_, ruaIndex) => 
                Array.from({ length: currentLayout.modulos }).map((_, moduloIndex) => {
                  const rua = ruaIndex + 1;
                  const modulo = moduloIndex + 1;
                  const posKey = getPositionKey(rua, modulo);
                  const isSelected = selectedPositions.has(posKey);
                  const hasInactive = hasInactiveFloors(rua, modulo);
                  
                  return (
                    <div
                      key={posKey}
                      className={cn(
                        "cursor-pointer transition-all duration-200 border-2 rounded-md flex items-center justify-center text-xs font-bold",
                        "hover:scale-105 hover:shadow-md",
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105" 
                          : hasInactive
                          ? "bg-orange-100 border-orange-300 text-orange-700"
                          : "bg-muted border-border hover:bg-muted/80"
                      )}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                      }}
                      onClick={() => togglePositionSelection(rua, modulo)}
                      title={`Rua ${rua}, Módulo ${modulo}${hasInactive ? ' (parcialmente inativo)' : ''}`}
                    >
                      {rua}.{modulo}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Etiquetas de ruas */}
            <div className="absolute -left-8 top-0 h-full flex flex-col justify-around">
              {Array.from({ length: currentLayout.ruas }).map((_, index) => (
                <div key={index} className="text-xs font-bold text-muted-foreground">
                  R{index + 1}
                </div>
              ))}
            </div>
            
            {/* Etiquetas de módulos */}
            <div className="absolute -top-6 left-0 w-full flex justify-around">
              {Array.from({ length: currentLayout.modulos }).map((_, index) => (
                <div key={index} className="text-xs font-bold text-muted-foreground">
                  M{index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-primary rounded-sm"></div>
            <span className="text-foreground/70">Selecionado</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-sm"></div>
            <span className="text-foreground/70">Parcialmente Inativo</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-muted border border-border rounded-sm"></div>
            <span className="text-foreground/70">Normal</span>
          </div>
        </div>
        
        {/* Info sobre seleção */}
        {selectedPositions.size > 0 && (
          <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-lg p-2">
            <div className="text-xs text-primary font-medium">
              {selectedPositions.size} posição(ões) selecionada(s)
            </div>
          </div>
        )}
      </div>
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
    setSelectedPositions(new Set()); // Limpar seleção de posições
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
    setSelectedPositions(new Set()); // Limpar seleção ao resetar
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
        <Tabs defaultValue="dimensoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dimensoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Dimensões
            </TabsTrigger>
            <TabsTrigger value="posicoes" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Posições
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensoes" className="space-y-6">
            {/* Controles de Dimensões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Número de Ruas</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.ruas]}
                    onValueChange={([value]) => updateDimensions('ruas', value)}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.ruas}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Módulos por Rua</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.modulos]}
                    onValueChange={([value]) => updateDimensions('modulos', value)}
                    max={250}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.modulos}</span>
                    <span>250</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Número de Andares</Label>
                <div className="space-y-2">
                  <Slider
                    value={[currentLayout.andares]}
                    onValueChange={([value]) => updateDimensions('andares', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{currentLayout.andares}</span>
                    <span>10</span>
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
          
          
          <TabsContent value="posicoes" className="space-y-6">
            {/* Vista 2D para seleção de posições */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">Seleção de Posições</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedPositions(new Set())}
                    disabled={selectedPositions.size === 0}
                  >
                    Limpar Seleção
                  </Button>
                  <Badge variant="secondary">
                    {selectedPositions.size} posição(ões)
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Clique nas posições na vista superior para selecioná-las, depois escolha quais andares ativar/desativar.
              </p>
              
              {render2DView()}
            </div>

            {/* Controles de Andares */}
            {selectedPositions.size > 0 && (
              <div className="space-y-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Controlar Andares das Posições Selecionadas
                </Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Desativar Andares</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: currentLayout.andares }).map((_, index) => (
                        <Button
                          key={index}
                          variant="destructive"
                          size="sm"
                          onClick={() => deactivateFloorsForSelected([index + 1])}
                          className="w-12 h-12"
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivateFloorsForSelected(
                        Array.from({ length: currentLayout.andares }, (_, i) => i + 1)
                      )}
                      className="w-full"
                    >
                      Desativar Todos os Andares
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Ativar Andares</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: currentLayout.andares }).map((_, index) => (
                        <Button
                          key={index}
                          variant="default"
                          size="sm"
                          onClick={() => activateFloorsForSelected([index + 1])}
                          className="w-12 h-12"
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => activateFloorsForSelected(
                        Array.from({ length: currentLayout.andares }, (_, i) => i + 1)
                      )}
                      className="w-full"
                    >
                      Ativar Todos os Andares
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}