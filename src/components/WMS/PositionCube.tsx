import { useState, useRef } from "react"
import { Mesh } from "three"
import { ThreeEvent } from "@react-three/fiber"

interface PositionCubeProps {
  position: [number, number, number]
  occupied: boolean
  codigo: string
  onClick: () => void
  onHover: (hovered: boolean) => void
  rua: number
  isSelected?: boolean
}

export function PositionCube({ position, occupied, codigo, onClick, onHover, rua, isSelected }: PositionCubeProps) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<Mesh>(null)

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    onHover(true)
  }

  const handlePointerOut = () => {
    setHovered(false)
    onHover(false)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick()
  }

  // Cores: Verde para livre, Vermelho para ocupado, Amarelo para selecionado
  const baseColor = isSelected 
    ? "#fbbf24" // Amarelo para selecionado
    : occupied 
    ? "#ef4444" // Vermelho para ocupado
    : "#22c55e" // Verde único para livre
    
  const emissiveColor = hovered || isSelected ? "#ffffff" : "#000000"
  const emissiveIntensity = hovered || isSelected ? 0.3 : 0

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={hovered ? 1 : 0.9}
      />
    </mesh>
  )
}
