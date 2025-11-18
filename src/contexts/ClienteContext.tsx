import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Cliente, useClientes as useClientesHook } from "@/hooks/useClientes"

interface ClienteContextType {
  selectedCliente: Cliente | null
  setSelectedCliente: (cliente: Cliente | null) => void
  availableClientes: Cliente[]
  setAvailableClientes: (clientes: Cliente[]) => void
  clearSelectedCliente: () => void
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined)

const STORAGE_KEY = "agrohub:selected-cliente"

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [selectedCliente, setSelectedClienteState] = useState<Cliente | null>(null)
  const [availableClientes, setAvailableClientes] = useState<Cliente[]>([])
  const { data: clientes } = useClientesHook()

  // Atualizar availableClientes quando os clientes carregarem
  useEffect(() => {
    if (clientes && clientes.length > 0) {
      setAvailableClientes(clientes)
    }
  }, [clientes])

  // Carregar cliente selecionado do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const cliente = JSON.parse(stored)
        setSelectedClienteState(cliente)
      }
    } catch (error) {
      console.error("Erro ao carregar cliente do localStorage:", error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Atualizar localStorage quando cliente selecionado mudar
  const setSelectedCliente = (cliente: Cliente | null) => {
    setSelectedClienteState(cliente)
    if (cliente) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Limpar seleção
  const clearSelectedCliente = () => {
    setSelectedClienteState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Auto-selecionar primeiro cliente se não houver seleção e houver clientes disponíveis
  useEffect(() => {
    if (!selectedCliente && availableClientes.length > 0) {
      setSelectedCliente(availableClientes[0])
    }
  }, [availableClientes, selectedCliente])

  return (
    <ClienteContext.Provider
      value={{
        selectedCliente,
        setSelectedCliente,
        availableClientes,
        setAvailableClientes,
        clearSelectedCliente,
      }}
    >
      {children}
    </ClienteContext.Provider>
  )
}

export function useCliente() {
  const context = useContext(ClienteContext)
  if (context === undefined) {
    throw new Error("useCliente must be used within a ClienteProvider")
  }
  return context
}
