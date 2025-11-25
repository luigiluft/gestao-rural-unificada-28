import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useCurrentUserFranquias } from "@/hooks/useCurrentUserFranquias"

interface Franquia {
  id: string
  nome: string
  cnpj: string
  papel?: 'master' | 'operador'
  franquia_usuario_id?: string
}

interface FranquiaContextType {
  selectedFranquia: Franquia | null
  setSelectedFranquia: (franquia: Franquia) => void
  availableFranquias: Franquia[]
  isLoading: boolean
}

const FranquiaContext = createContext<FranquiaContextType | undefined>(undefined)

export const FranquiaProvider = ({ children }: { children: ReactNode }) => {
  const { franquias, isLoading } = useCurrentUserFranquias()
  const [selectedFranquia, setSelectedFranquiaState] = useState<Franquia | null>(null)

  // Carregar franquia do localStorage na inicialização
  useEffect(() => {
    const savedFranquiaId = localStorage.getItem("selectedFranquiaId")
    if (savedFranquiaId && franquias.length > 0) {
      const franquia = franquias.find(f => f.id === savedFranquiaId)
      if (franquia) {
        setSelectedFranquiaState(franquia)
      } else {
        // Se a franquia salva não existe mais, seleciona a primeira
        setSelectedFranquiaState(franquias[0])
      }
    } else if (franquias.length > 0 && !selectedFranquia) {
      // Se não tem franquia salva, seleciona a primeira
      setSelectedFranquiaState(franquias[0])
    }
  }, [franquias])

  const setSelectedFranquia = (franquia: Franquia) => {
    setSelectedFranquiaState(franquia)
    localStorage.setItem("selectedFranquiaId", franquia.id)
  }

  return (
    <FranquiaContext.Provider
      value={{
        selectedFranquia,
        setSelectedFranquia,
        availableFranquias: franquias,
        isLoading,
      }}
    >
      {children}
    </FranquiaContext.Provider>
  )
}

export const useFranquia = () => {
  const context = useContext(FranquiaContext)
  if (context === undefined) {
    throw new Error("useFranquia must be used within a FranquiaProvider")
  }
  return context
}
