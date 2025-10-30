import { Suspense, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei"
import { useWarehouseMap } from "@/hooks/useWarehouseMap"
import { WarehouseStats } from "./WarehouseStats"
import { PositionCube } from "./PositionCube"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Box, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
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

function Scene({ positions, selectedFloor, onPositionClick, dimensions }: any) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)

  // Filtrar posições pelo andar selecionado
  const filteredPositions = selectedFloor === 0
    ? positions
    : positions.filter((p: any) => p.andar === selectedFloor)

  // Calcular posição inicial da câmera baseada nas dimensões reais
  const cameraPosition: [number, number, number] = [
    dimensions.maxRua * 1.5,
    dimensions.maxAndar * 2.5,
    dimensions.maxModulo * 1.5
  ]

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
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

      {filteredPositions.map((pos: any) => (
        <PositionCube
          key={pos.id}
          position={[pos.rua, pos.andar, pos.modulo]}
          occupied={pos.ocupado}
          codigo={pos.codigo}
          onClick={() => onPositionClick(pos)}
          onHover={(hovered) => setHoveredPosition(hovered ? pos.codigo : null)}
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

  return (
    <div className="space-y-6">
      <WarehouseStats stats={data.stats} />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-sm">Livre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive rounded" />
                <span className="text-sm">Ocupado</span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:w-64">
                <label className="text-sm font-medium mb-2 block">
                  Andar: {selectedFloor === 0 ? "Todos" : selectedFloor}
                </label>
                <Slider
                  value={[selectedFloor]}
                  onValueChange={(value) => setSelectedFloor(value[0])}
                  min={0}
                  max={data.dimensions.maxAndar}
                  step={1}
                  className="w-full"
                />
              </div>

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

          <div className="h-[600px] w-full rounded-lg overflow-hidden bg-background border">
            <Canvas key={cameraKey}>
              <Suspense fallback={null}>
                <Scene
                  positions={data.positions}
                  selectedFloor={selectedFloor}
                  onPositionClick={setSelectedPosition}
                  dimensions={data.dimensions}
                />
              </Suspense>
            </Canvas>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              <p>🖱️ Arraste para rotacionar • 🔍 Scroll para zoom • 🖱️ Clique nos cubos para detalhes</p>
            </div>
            <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-md p-2">
              Renderizando{" "}
              <span className="font-semibold text-foreground">
                {selectedFloor === 0 ? data.positions.length : data.positions.filter((p: any) => p.andar === selectedFloor).length}
              </span>
              {" "}de{" "}
              <span className="font-semibold text-foreground">{data.positions.length}</span>
              {" "}posições • Dimensões: {data.dimensions.maxRua}R × {data.dimensions.maxModulo}M × {data.dimensions.maxAndar}A
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
