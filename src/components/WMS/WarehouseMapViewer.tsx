import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Text } from "@react-three/drei";
import { useWarehouseMap } from "@/hooks/useWarehouseMap";
import { useStorageAudit, type AuditPositionMetadata } from "@/hooks/useStorageAudit";
import { WarehouseStats } from "./WarehouseStats";
import { PositionCube } from "./PositionCube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, RotateCcw, Filter, Bug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
interface WarehouseMapViewerProps {
  depositoId?: string;
}
interface SelectedPosition {
  codigo: string;
  ocupado: boolean;
  palletInfo?: {
    numero_pallet: number;
    descricao: string | null;
  } | null;
}
function Scene({
  positions,
  selectedFloor,
  onPositionClick,
  dimensions,
  ruaRange,
  moduloRange,
  showOnlyOccupied,
  selectedPositionCodigo,
  diagnostics,
  missingPositions
}: any) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  // Filtrar posições por andar, rua, módulo e ocupação
  const filteredPositions = positions.filter((p: any) => {
    const floorMatch = selectedFloor === 0 || p.andar === selectedFloor;
    const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1];
    const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1];
    const occupiedMatch = !showOnlyOccupied || p.ocupado;
    return floorMatch && ruaMatch && moduloMatch && occupiedMatch;
  });

  // Calcular posição inicial da câmera baseada nas dimensões reais (com espaçamento)
  const cameraPosition: [number, number, number] = [dimensions.maxRua * 2.4, dimensions.maxAndar * 4.8, dimensions.maxModulo * 2.4];

  // Criar labels para as ruas (apenas as visíveis)
  const ruaLabels = [];
  for (let r = ruaRange[0]; r <= ruaRange[1]; r += 2) {
    ruaLabels.push(<Text key={`rua-${r}`} position={[r * 1.2, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.8} color="#6b7280" anchorX="center" anchorY="middle">
        R{r.toString().padStart(2, '0')}
      </Text>);
  }
  return <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={100} maxPolarAngle={Math.PI / 2} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, -10]} intensity={0.5} />
      
      <Grid args={[100, 100]} cellSize={1} cellThickness={0.5} cellColor="#6b7280" sectionSize={5} sectionThickness={1} sectionColor="#9ca3af" fadeDistance={50} fadeStrength={1} position={[0, -0.5, 0]} />

      {ruaLabels}
      
      {filteredPositions.map((pos: any) => <PositionCube key={pos.id} position={[pos.rua * 1.2, pos.andar * 1.2, pos.modulo * 1.2]} occupied={pos.ocupado} codigo={pos.codigo} onClick={() => onPositionClick(pos)} onHover={hovered => setHoveredPosition(hovered ? pos.codigo : null)} rua={pos.rua} isSelected={pos.codigo === selectedPositionCodigo} />)}

      {/* Ghost cubes para posições esperadas mas não renderizadas (modo diagnóstico) */}
      {diagnostics && missingPositions.map((pos: any) => <mesh key={`ghost-${pos.codigo}`} position={[pos.rua * 1.2, pos.andar * 1.2, pos.modulo * 1.2]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshBasicMaterial color="#ff00ff" wireframe opacity={0.3} transparent />
        </mesh>)}

      {hoveredPosition && <mesh position={[0, -1, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>}
    </>;
}
export function WarehouseMapViewer({
  depositoId
}: WarehouseMapViewerProps) {
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [auditMode, setAuditMode] = useState(false);
  const [ruaRange, setRuaRange] = useState<[number, number]>([1, 7]);
  const [moduloRange, setModuloRange] = useState<[number, number]>([1, 25]);
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const {
    data,
    isLoading
  } = useWarehouseMap(depositoId, includeInactive);
  const {
    data: auditData,
    isLoading: auditLoading
  } = useStorageAudit(depositoId, auditMode);

  // Helper para formatar código com zero padding
  const code = (r: number, m: number, a: number) => `R${String(r).padStart(2, '0')}-M${String(m).padStart(2, '0')}-A${String(a).padStart(2, '0')}`;

  // Calcular diagnósticos MULTI-ANDAR para Rua 01 (todos os andares)
  const getDiagnostics = () => {
    if (!data || !diagnostics) return null;
    const auditPositions = auditData?.positions || [];
    const targetRua = 1;
    const results: Record<string, {
      expected: number;
      present: number;
      rendered: number;
      missing: string[];
      filtered: string[];
      missingDetails: Array<{
        codigo: string;
        reason: string;
        metadata?: AuditPositionMetadata;
      }>;
    }> = {};
    const allMissingPositions: any[] = [];

    // Para cada andar (1 até maxAndar)
    for (let andar = 1; andar <= data.dimensions.maxAndar; andar++) {
      // Posições esperadas: R01-M01-A{andar} até R01-M{maxModulo}-A{andar}
      const expectedCodes = [];
      for (let m = 1; m <= data.dimensions.maxModulo; m++) {
        expectedCodes.push(code(targetRua, m, andar));
      }

      // Posições presentes nos dados (do banco)
      const presentInData = new Set(data.positions.filter((p: any) => p.rua === targetRua && p.andar === andar).map((p: any) => p.codigo));

      // Posições que passam pelos filtros (renderizadas)
      const renderedInScene = new Set(data.positions.filter((p: any) => {
        const floorMatch = selectedFloor === 0 || p.andar === selectedFloor;
        const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1];
        const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1];
        const occupiedMatch = !showOnlyOccupied || p.ocupado;
        return p.rua === targetRua && p.andar === andar && floorMatch && ruaMatch && moduloMatch && occupiedMatch;
      }).map((p: any) => p.codigo));

      // Faltando no banco
      const missing = expectedCodes.filter(c => !presentInData.has(c));

      // Filtradas (existem no banco mas não renderizadas)
      const filtered = Array.from(presentInData).filter(c => !renderedInScene.has(c));

      // Analyze missing positions with audit data
      const missingDetails = missing.map(codigo => {
        const auditPos = auditPositions.find(p => p.codigo === codigo);
        if (!auditPos) {
          return {
            codigo,
            reason: '❌ Não existe no banco de dados',
            metadata: undefined
          };
        }
        if (!auditPos.ativo) {
          return {
            codigo,
            reason: '⚠️ Posição inativa (ativo=false)',
            metadata: auditPos
          };
        }
        if (auditPos.deposito_id !== depositoId) {
          return {
            codigo,
            reason: `🔴 deposito_id incorreto: ${auditPos.deposito_id}`,
            metadata: auditPos
          };
        }
        return {
          codigo,
          reason: '🔒 Bloqueada por RLS (permissões)',
          metadata: auditPos
        };
      });

      // Adicionar posições faltantes para ghost cubes
      const missingInAndar = expectedCodes.filter(c => !presentInData.has(c)).map(c => {
        const parts = c.match(/R(\d+)-M(\d+)-A(\d+)/);
        return parts ? {
          codigo: c,
          rua: parseInt(parts[1]),
          modulo: parseInt(parts[2]),
          andar: parseInt(parts[3])
        } : null;
      }).filter(Boolean);
      allMissingPositions.push(...missingInAndar);
      results[`A${String(andar).padStart(2, '0')}`] = {
        expected: expectedCodes.length,
        present: presentInData.size,
        rendered: renderedInScene.size,
        missing,
        filtered,
        missingDetails
      };
    }
    return {
      byFloor: results,
      missingPositions: allMissingPositions
    };
  };
  const diagnosticData = getDiagnostics();

  // Handler para forçar reload dos dados
  const handleForceReload = () => {
    queryClient.invalidateQueries({
      queryKey: ['warehouse-map']
    });
    queryClient.invalidateQueries({
      queryKey: ['storage-audit']
    });
    toast({
      title: "Dados recarregados",
      description: "Buscando posições atualizadas do banco de dados"
    });
  };
  const handleToggleAudit = () => {
    setAuditMode(!auditMode);
    if (!auditMode) {
      toast({
        title: "Modo Auditoria Ativado",
        description: "Comparando dados com e sem RLS..."
      });
    }
  };

  // Log automático MULTI-ANDAR ao carregar ou mudar filtros
  useEffect(() => {
    if (diagnostics && diagnosticData && data) {
      console.log('🔍 === DIAGNÓSTICO WMS MULTI-ANDAR (RUA 01) ===');
      console.log('Modo Auditoria:', auditMode);
      console.log('Incluir Inativas:', includeInactive);
      console.log('Filtros ativos:', {
        selectedFloor,
        ruaRange,
        moduloRange,
        showOnlyOccupied,
        depositoId
      });
      if (auditData) {
        console.log('📊 Auditoria (sem RLS):', {
          totalNoAudit: auditData.totalPositions,
          franquiaId: auditData.franquiaId,
          masterFranqueadoId: auditData.masterFranqueadoId
        });
      }

      // Resumo geral
      let totalExpected = 0;
      let totalPresent = 0;
      let totalRendered = 0;
      let totalMissing = 0;
      let totalFiltered = 0;
      Object.values(diagnosticData.byFloor).forEach((floor: any) => {
        totalExpected += floor.expected;
        totalPresent += floor.present;
        totalRendered += floor.rendered;
        totalMissing += floor.missing.length;
        totalFiltered += floor.filtered.length;
      });
      console.table({
        'Total Esperadas (R01 todos andares)': totalExpected,
        'Total no Banco (com RLS)': totalPresent,
        'Total Renderizadas': totalRendered,
        'Total Faltando': totalMissing,
        'Total Filtradas': totalFiltered,
        'Total no Audit (sem RLS)': auditData?.totalPositions || 'N/A'
      });

      // Detalhes por andar
      console.log('\n📊 DETALHES POR ANDAR:');
      Object.entries(diagnosticData.byFloor).forEach(([andar, stats]: [string, any]) => {
        console.log(`\n${andar}:`, {
          esperadas: stats.expected,
          presentes: stats.present,
          renderizadas: stats.rendered,
          faltando: stats.missing.length,
          filtradas: stats.filtered.length
        });
        if (stats.missing.length > 0) {
          console.warn(`  ❌ ${andar} - Faltando:`, stats.missing);
          if (stats.missingDetails && stats.missingDetails.length > 0) {
            console.log(`  🔍 Análise das faltantes:`);
            stats.missingDetails.forEach((detail: any) => {
              console.log(`    ${detail.codigo}: ${detail.reason}`, detail.metadata || '');
            });
          }
        }
        if (stats.filtered.length > 0) {
          console.warn(`  ⚠️ ${andar} - Filtradas:`, stats.filtered);
        }
      });
    }
  }, [diagnostics, data, selectedFloor, ruaRange, moduloRange, showOnlyOccupied, depositoId, auditMode, auditData, includeInactive]);

  // Atualizar ranges quando os dados carregarem
  useEffect(() => {
    if (data) {
      if (ruaRange[1] === 7 && data.dimensions.maxRua !== 7) {
        setRuaRange([1, data.dimensions.maxRua]);
      }
      if (moduloRange[1] === 25 && data.dimensions.maxModulo !== 25) {
        setModuloRange([1, data.dimensions.maxModulo]);
      }
    }
  }, [data]);
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>;
  }
  if (!data || data.positions.length === 0) {
    return <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma posição cadastrada</h3>
            <p className="text-muted-foreground">Configure as posições do armazém para visualizar o mapa 3D</p>
          </div>
        </CardContent>
      </Card>;
  }
  const handleResetCamera = () => {
    setCameraKey(prev => prev + 1);
  };
  const handleResetFilters = () => {
    setSelectedFloor(1); // Resetar para andar 1 (mais comum)
    setRuaRange([1, data?.dimensions.maxRua || 7]);
    setModuloRange([1, data?.dimensions.maxModulo || 25]);
    setShowOnlyOccupied(false);
  };

  // Calcular estatísticas dos itens filtrados
  const getFilteredStats = () => {
    if (!data) return {
      total: 0,
      visible: 0,
      occupied: 0,
      free: 0
    };
    const visible = data.positions.filter((p: any) => {
      const floorMatch = selectedFloor === 0 || p.andar === selectedFloor;
      const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1];
      const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1];
      const occupiedMatch = !showOnlyOccupied || p.ocupado;
      return floorMatch && ruaMatch && moduloMatch && occupiedMatch;
    });
    const occupied = visible.filter((p: any) => p.ocupado).length;
    return {
      total: data.positions.length,
      visible: visible.length,
      occupied,
      free: visible.length - occupied
    };
  };
  const filteredStats = getFilteredStats();
  return <div className="space-y-6">
      <WarehouseStats stats={data.stats} />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 mb-4">
            {/* Legenda e controles principais */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded" />
                  <span className="text-sm">Livre (por rua)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded" />
                  <span className="text-sm">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span className="text-sm">Selecionado</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Ocultar" : "Mostrar"} Filtros
                </Button>
                
                
                <Button variant="outline" size="sm" onClick={handleForceReload} title="Recarregar dados do banco">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
                
                
              </div>
            </div>

            {/* Painel de filtros avançados */}
            {showFilters && <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filtros Avançados</h4>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Limpar Filtros
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtro de Andar */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Andar: {selectedFloor === 0 ? "Todos" : selectedFloor}
                    </Label>
                    <Slider value={[selectedFloor]} onValueChange={value => setSelectedFloor(value[0])} min={0} max={data.dimensions.maxAndar} step={1} className="w-full" />
                  </div>

                  {/* Filtro de Rua */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Ruas: {ruaRange[0]} - {ruaRange[1]}
                    </Label>
                    <div className="space-y-2">
                      <Slider value={ruaRange} onValueChange={value => setRuaRange(value as [number, number])} min={1} max={data.dimensions.maxRua} step={1} className="w-full" />
                    </div>
                  </div>

                  {/* Filtro de Módulo */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Módulos: {moduloRange[0]} - {moduloRange[1]}
                    </Label>
                    <Slider value={moduloRange} onValueChange={value => setModuloRange(value as [number, number])} min={1} max={data.dimensions.maxModulo} step={1} className="w-full" />
                  </div>
                </div>

                {/* Toggle apenas ocupados */}
                <div className="flex items-center space-x-2">
                  <Switch id="show-occupied" checked={showOnlyOccupied} onCheckedChange={setShowOnlyOccupied} />
                  <Label htmlFor="show-occupied" className="text-sm cursor-pointer">
                    Mostrar apenas posições ocupadas
                  </Label>
                </div>
              </div>}
          </div>

          <div className="h-[600px] w-full rounded-lg overflow-hidden bg-background border relative">
            <Canvas key={cameraKey}>
              <Suspense fallback={null}>
                <Scene positions={data.positions} selectedFloor={selectedFloor} onPositionClick={setSelectedPosition} dimensions={data.dimensions} ruaRange={ruaRange} moduloRange={moduloRange} showOnlyOccupied={showOnlyOccupied} selectedPositionCodigo={selectedPosition?.codigo} diagnostics={diagnostics} missingPositions={diagnosticData?.missingPositions || []} />
              </Suspense>
            </Canvas>
            
            {/* Mini-mapa 2D */}
            
          </div>

          {/* Painel de diagnóstico MULTI-ANDAR */}
          {diagnostics && diagnosticData && <Card className="mt-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Diagnóstico Multi-Andar (Rua 01)
                    {auditMode && auditData && <Badge variant="secondary" className="ml-2">
                        Auditoria: {auditData.totalPositions} posições (sem RLS)
                      </Badge>}
                    {auditLoading && <span className="ml-2 text-xs">⏳ Carregando auditoria...</span>}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo por andar */}
                <div className="space-y-2 text-xs">
                  {Object.entries(diagnosticData.byFloor).map(([andar, stats]: [string, any]) => <div key={andar} className="flex items-center justify-between border-b pb-2">
                      <span className="font-mono font-semibold">R01-{andar}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {stats.rendered}/{stats.expected} renderizadas
                        </span>
                        {stats.missing.length > 0 && <Badge variant="destructive" className="text-xs">
                            {stats.missing.length} {auditMode ? 'ocultas por RLS' : 'faltando DB'}
                          </Badge>}
                        {stats.filtered.length > 0 && <Badge variant="secondary" className="text-xs">
                            {stats.filtered.length} filtradas
                          </Badge>}
                      </div>
                    </div>)}
                </div>
                
                {/* Detalhes expandíveis */}
                <Collapsible>
                  <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver detalhes dos problemas ▼
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {Object.entries(diagnosticData.byFloor).map(([andar, stats]: [string, any]) => <div key={`details-${andar}`}>
                        {stats.missing.length > 0 && auditMode && stats.missingDetails && stats.missingDetails.length > 0 && <Alert variant="destructive" className="py-2">
                            <AlertTitle className="text-xs font-semibold mb-1">
                              {andar}: Análise Detalhada ({stats.missing.length} posições)
                            </AlertTitle>
                            <AlertDescription className="text-xs space-y-1 mt-2">
                              {stats.missingDetails.map((detail: any, idx: number) => <div key={idx} className="border-l-2 border-destructive/50 pl-2 py-1">
                                  <div className="font-mono font-semibold">{detail.codigo}</div>
                                  <div className="text-muted-foreground">{detail.reason}</div>
                                  {detail.metadata && <div className="text-[10px] mt-1 space-y-0.5">
                                      <div>ID: {detail.metadata.id.slice(0, 8)}...</div>
                                      <div>Ativo: {detail.metadata.ativo ? '✅' : '❌'}</div>
                                      <div>Ocupado: {detail.metadata.ocupado ? '✅' : '❌'}</div>
                                      <div>Criado: {new Date(detail.metadata.created_at).toLocaleDateString()}</div>
                                    </div>}
                                </div>)}
                            </AlertDescription>
                          </Alert>}
                        
                        {stats.missing.length > 0 && !auditMode && <Alert variant="destructive" className="py-2">
                            <AlertTitle className="text-xs font-semibold mb-1">
                              {andar}: Posições faltando ({stats.missing.length})
                            </AlertTitle>
                            <AlertDescription className="text-xs font-mono">
                              {stats.missing.join(', ')}
                              <div className="mt-2 text-muted-foreground">
                                💡 Ative "Auditoria" para análise detalhada
                              </div>
                            </AlertDescription>
                          </Alert>}
                        
                        {stats.filtered.length > 0 && <Alert className="py-2">
                            <AlertTitle className="text-xs font-semibold mb-1">
                              {andar}: Posições filtradas (existem mas não renderizam)
                            </AlertTitle>
                            <AlertDescription className="text-xs font-mono">
                              {stats.filtered.join(', ')}
                            </AlertDescription>
                          </Alert>}
                      </div>)}
                  </CollapsibleContent>
                </Collapsible>
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  💡 Cubos magenta = posições faltando no banco. Verifique console para logs detalhados.
                </div>
              </CardContent>
            </Card>}

          <div className="mt-4 space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              <p>🖱️ Arraste para rotacionar • 🔍 Scroll para zoom • 🖱️ Clique nos cubos para detalhes</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-muted/50 rounded-md p-3">
              <div className="text-center">
                <div className="font-semibold text-lg text-foreground">{filteredStats.visible}</div>
                <div className="text-muted-foreground">Renderizando</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-foreground">{filteredStats.total}</div>
                <div className="text-muted-foreground">Total no Armazém</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-destructive">{filteredStats.occupied}</div>
                <div className="text-muted-foreground">Ocupadas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">{filteredStats.free}</div>
                <div className="text-muted-foreground">Livres</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Dimensões: {data.dimensions.maxRua}R × {data.dimensions.maxModulo}M × {data.dimensions.maxAndar}A
              {" "}• Filtros: R{ruaRange[0]}-{ruaRange[1]} | M{moduloRange[0]}-{moduloRange[1]} | A{selectedFloor === 0 ? "Todos" : selectedFloor}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPosition} onOpenChange={() => setSelectedPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Posição: {selectedPosition?.codigo}
              <Badge variant={selectedPosition?.ocupado ? "destructive" : "default"}>
                {selectedPosition?.ocupado ? "Ocupado" : "Livre"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informações da posição de armazenamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPosition?.ocupado && selectedPosition.palletInfo ? <>
                <div>
                  <label className="text-sm font-medium">Número do Pallet</label>
                  <p className="text-lg">{selectedPosition.palletInfo.numero_pallet}</p>
                </div>
                {selectedPosition.palletInfo.descricao && <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPosition.palletInfo.descricao}
                    </p>
                  </div>}
              </> : <div className="text-center py-4">
                <Box className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Posição livre para alocação</p>
              </div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}