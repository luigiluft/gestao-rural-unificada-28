import { Suspense, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid, Text } from "@react-three/drei"
import { useWarehouseMap } from "@/hooks/useWarehouseMap"
import { WarehouseStats } from "./WarehouseStats"
import { PositionCube } from "./PositionCube"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Box, RotateCcw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WarehouseMapViewerProps {
  depositoId?: string
}

interface SelectedPosition {
  codigo: string
  ocupado: boolean
  palletInfo?: {
    numero_pallet: number
    descricao: string | null
  } | null
}

function Scene({ 
  positions, 
  selectedFloor, 
  onPositionClick, 
  dimensions,
  ruaRange,
  moduloRange,
  showOnlyOccupied,
  selectedPositionCodigo 
}: any) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)

  // Filtrar posições por andar, rua, módulo e ocupação
  const filteredPositions = positions.filter((p: any) => {
    const floorMatch = selectedFloor === 0 || p.andar === selectedFloor
    const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1]
    const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1]
    const occupiedMatch = !showOnlyOccupied || p.ocupado
    return floorMatch && ruaMatch && moduloMatch && occupiedMatch
  })

  // Calcular posição inicial da câmera baseada nas dimensões reais (com espaçamento)
  const cameraPosition: [number, number, number] = [
    dimensions.maxRua * 2.4,
    dimensions.maxAndar * 4.8,
    dimensions.maxModulo * 2.4
  ]
  
  // Criar labels para as ruas (apenas as visíveis)
  const ruaLabels = []
  for (let r = ruaRange[0]; r <= ruaRange[1]; r += 2) {
    ruaLabels.push(
      <Text
        key={`rua-${r}`}
        position={[r * 1.2, -1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.8}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        R{r.toString().padStart(2, '0')}
      </Text>
    )
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, -10]} intensity={0.5} />
      
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={50}
        fadeStrength={1}
        position={[0, -0.5, 0]}
      />

      {ruaLabels}
      
      {filteredPositions.map((pos: any) => (
        <PositionCube
          key={pos.id}
          position={[pos.rua * 1.2, pos.andar * 1.2, pos.modulo * 1.2]}
          occupied={pos.ocupado}
          codigo={pos.codigo}
          onClick={() => onPositionClick(pos)}
          onHover={(hovered) => setHoveredPosition(hovered ? pos.codigo : null)}
          rua={pos.rua}
          isSelected={pos.codigo === selectedPositionCodigo}
        />
      ))}

      {hoveredPosition && (
        <mesh position={[0, -1, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  )
}

export function WarehouseMapViewer({ depositoId }: WarehouseMapViewerProps) {
  const { data, isLoading } = useWarehouseMap(depositoId)
  const [selectedFloor, setSelectedFloor] = useState(0)
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null)
  const [cameraKey, setCameraKey] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [ruaRange, setRuaRange] = useState<[number, number]>([1, 14])
  const [moduloRange, setModuloRange] = useState<[number, number]>([1, 25])
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false)
  
  // Atualizar ranges quando os dados carregarem
  if (data && ruaRange[1] === 14 && data.dimensions.maxRua !== 14) {
    setRuaRange([1, data.dimensions.maxRua])
  }
  if (data && moduloRange[1] === 25 && data.dimensions.maxModulo !== 25) {
    setModuloRange([1, data.dimensions.maxModulo])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!data || data.positions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma posição cadastrada</h3>
            <p className="text-muted-foreground">Configure as posições do armazém para visualizar o mapa 3D</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleResetCamera = () => {
    setCameraKey(prev => prev + 1)
  }
  
  const handleResetFilters = () => {
    setSelectedFloor(0)
    setRuaRange([1, data?.dimensions.maxRua || 14])
    setModuloRange([1, data?.dimensions.maxModulo || 25])
    setShowOnlyOccupied(false)
  }
  
  // Calcular estatísticas dos itens filtrados
  const getFilteredStats = () => {
    if (!data) return { total: 0, visible: 0, occupied: 0, free: 0 }
    
    const visible = data.positions.filter((p: any) => {
      const floorMatch = selectedFloor === 0 || p.andar === selectedFloor
      const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1]
      const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1]
      const occupiedMatch = !showOnlyOccupied || p.ocupado
      return floorMatch && ruaMatch && moduloMatch && occupiedMatch
    })
    
    const occupied = visible.filter((p: any) => p.ocupado).length
    
    return {
      total: data.positions.length,
      visible: visible.length,
      occupied,
      free: visible.length - occupied
    }
  }
  
  const filteredStats = getFilteredStats()

  return (
    <div className="space-y-6">
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

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Ocultar" : "Mostrar"} Filtros
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetCamera}
                  title="Resetar Câmera"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Painel de filtros avançados */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
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
                    <Slider
                      value={[selectedFloor]}
                      onValueChange={(value) => setSelectedFloor(value[0])}
                      min={0}
                      max={data.dimensions.maxAndar}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Filtro de Rua */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Ruas: {ruaRange[0]} - {ruaRange[1]}
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        value={ruaRange}
                        onValueChange={(value) => setRuaRange(value as [number, number])}
                        min={1}
                        max={data.dimensions.maxRua}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Filtro de Módulo */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Módulos: {moduloRange[0]} - {moduloRange[1]}
                    </Label>
                    <Slider
                      value={moduloRange}
                      onValueChange={(value) => setModuloRange(value as [number, number])}
                      min={1}
                      max={data.dimensions.maxModulo}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Toggle apenas ocupados */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-occupied"
                    checked={showOnlyOccupied}
                    onCheckedChange={setShowOnlyOccupied}
                  />
                  <Label htmlFor="show-occupied" className="text-sm cursor-pointer">
                    Mostrar apenas posições ocupadas
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="h-[600px] w-full rounded-lg overflow-hidden bg-background border relative">
            <Canvas key={cameraKey}>
              <Suspense fallback={null}>
                <Scene
                  positions={data.positions}
                  selectedFloor={selectedFloor}
                  onPositionClick={setSelectedPosition}
                  dimensions={data.dimensions}
                  ruaRange={ruaRange}
                  moduloRange={moduloRange}
                  showOnlyOccupied={showOnlyOccupied}
                  selectedPositionCodigo={selectedPosition?.codigo}
                />
              </Suspense>
            </Canvas>
            
            {/* Mini-mapa 2D */}
            <div className="absolute top-4 right-4 bg-background/90 border rounded-lg p-2 backdrop-blur-sm">
              <div className="text-xs font-semibold mb-1 text-center">Vista Superior</div>
              <div 
                className="grid gap-px bg-border"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(ruaRange[1] - ruaRange[0] + 1, 14)}, 8px)`,
                  gridTemplateRows: `repeat(${Math.min(moduloRange[1] - moduloRange[0] + 1, 25)}, 8px)`
                }}
              >
                {data.positions
                  .filter((p: any) => {
                    const floorMatch = selectedFloor === 0 || p.andar === selectedFloor
                    const ruaMatch = p.rua >= ruaRange[0] && p.rua <= ruaRange[1]
                    const moduloMatch = p.modulo >= moduloRange[0] && p.modulo <= moduloRange[1]
                    return floorMatch && ruaMatch && moduloMatch
                  })
                  .slice(0, 350) // Limitar para performance
                  .map((p: any) => (
                    <div
                      key={p.id}
                      className={`w-2 h-2 ${
                        p.codigo === selectedPosition?.codigo 
                          ? 'bg-yellow-500' 
                          : p.ocupado 
                          ? 'bg-destructive' 
                          : 'bg-green-500'
                      }`}
                      title={p.codigo}
                    />
                  ))}
              </div>
            </div>
          </div>

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
            {selectedPosition?.ocupado && selectedPosition.palletInfo ? (
              <>
                <div>
                  <label className="text-sm font-medium">Número do Pallet</label>
                  <p className="text-lg">{selectedPosition.palletInfo.numero_pallet}</p>
                </div>
                {selectedPosition.palletInfo.descricao && (
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPosition.palletInfo.descricao}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Box className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Posição livre para alocação</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
