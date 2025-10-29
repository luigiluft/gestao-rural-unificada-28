import { useState, useRef } from "react"
import { Mesh } from "three"
import { ThreeEvent } from "@react-three/fiber"

interface PositionCubeProps {
  position: [number, number, number]
  occupied: boolean
  codigo: string
  onClick: () => void
  onHover: (hovered: boolean) => void
}

export function PositionCube({ position, occupied, codigo, onClick, onHover }: PositionCubeProps) {
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

  // Cores: verde para livre, vermelho para ocupado
  const baseColor = occupied ? "#ef4444" : "#22c55e"
  const emissiveColor = hovered ? "#ffffff" : "#000000"
  const emissiveIntensity = hovered ? 0.3 : 0

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[0.85, 0.85, 0.85]} />
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
