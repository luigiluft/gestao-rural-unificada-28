import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import { useAuth } from "./AuthContext"
import { useClienteDepositos } from "@/hooks/useClienteDepositos"
import { useCliente } from "./ClienteContext"

interface Deposito {
  id: string
  nome: string
  franquia_id: string
  tipo_regime?: string
  codigo_interno?: string
}

interface DepositoContextType {
  selectedDeposito: Deposito | null
  setSelectedDeposito: (deposito: Deposito) => void
  availableDepositos: Deposito[]
  isLoading: boolean
}

const DepositoContext = createContext<DepositoContextType | undefined>(undefined)

export const DepositoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const { selectedCliente } = useCliente()
  const { data: depositos, isLoading } = useClienteDepositos(selectedCliente?.id)
  const [selectedDeposito, setSelectedDepositoState] = useState<Deposito | null>(null)
  const hasInitialized = useRef(false)

  // Mapear depositos para o formato esperado
  const availableDepositos: Deposito[] = depositos?.map(d => ({
    id: d.id,
    nome: d.nome,
    franquia_id: d.franquia_id,
    tipo_regime: d.tipo_regime,
    codigo_interno: d.codigo_interno || undefined
  })) || []

  // Adicionar opção "Todos os Depósitos" se houver mais de um
  const depositosWithAll: Deposito[] = availableDepositos.length > 1
    ? [{ id: "ALL", nome: "Todos os Depósitos", franquia_id: "ALL" }, ...availableDepositos]
    : availableDepositos

  // Reset quando cliente muda
  useEffect(() => {
    hasInitialized.current = false
    setSelectedDepositoState(null)
  }, [selectedCliente?.id])

  // Carregar deposito do localStorage na inicialização
  useEffect(() => {
    if (hasInitialized.current || depositosWithAll.length === 0 || !selectedCliente?.id) return
    
    hasInitialized.current = true
    const savedDepositoId = localStorage.getItem(`selectedDepositoId_${selectedCliente.id}`)
    
    if (savedDepositoId) {
      const deposito = depositosWithAll.find(d => d.id === savedDepositoId)
      if (deposito) {
        setSelectedDepositoState(deposito)
      } else {
        setSelectedDepositoState(depositosWithAll[0])
      }
    } else {
      setSelectedDepositoState(depositosWithAll[0])
    }
  }, [depositosWithAll.length, selectedCliente?.id])

  const setSelectedDeposito = (deposito: Deposito) => {
    setSelectedDepositoState(deposito)
    if (selectedCliente?.id) {
      localStorage.setItem(`selectedDepositoId_${selectedCliente.id}`, deposito.id)
    }
  }

  return (
    <DepositoContext.Provider
      value={{
        selectedDeposito,
        setSelectedDeposito,
        availableDepositos: depositosWithAll,
        isLoading,
      }}
    >
      {children}
    </DepositoContext.Provider>
  )
}

export const useDeposito = () => {
  const context = useContext(DepositoContext)
  if (context === undefined) {
    throw new Error("useDeposito must be used within a DepositoProvider")
  }
  return context
}
