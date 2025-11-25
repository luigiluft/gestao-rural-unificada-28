import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useCurrentUserFranquias } from "@/hooks/useCurrentUserFranquias"
import { useDepositosDisponiveis } from "@/hooks/useDepositosDisponiveis"
import { useAuth } from "./AuthContext"
import { useUserRole } from "@/hooks/useUserRole"

interface Franquia {
  id: string
  nome: string
  cnpj?: string
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
  const { user } = useAuth()
  const { isProdutor } = useUserRole()
  const { franquias: franqueadoFranquias, isLoading: franqueadoLoading } = useCurrentUserFranquias()
  const { data: produtorDepositos, isLoading: produtorLoading } = useDepositosDisponiveis(user?.id)
  const [selectedFranquia, setSelectedFranquiaState] = useState<Franquia | null>(null)

  // Determinar franquias disponíveis baseado no role
  const availableFranquias = isProdutor 
    ? (produtorDepositos?.map(d => ({
        id: d.deposito_id,
        nome: d.deposito_nome,
        cnpj: undefined
      })) || [])
    : franqueadoFranquias

  const isLoading = isProdutor ? produtorLoading : franqueadoLoading

  // Adicionar opção "Todos os Depósitos" apenas para produtores com múltiplos depósitos
  const franquiasWithAll: Franquia[] = isProdutor && availableFranquias.length > 1
    ? [{ id: "ALL", nome: "Todos os Depósitos" }, ...availableFranquias]
    : availableFranquias

  // Carregar franquia do localStorage na inicialização
  useEffect(() => {
    const savedFranquiaId = localStorage.getItem("selectedFranquiaId")
    if (savedFranquiaId && franquiasWithAll.length > 0) {
      const franquia = franquiasWithAll.find(f => f.id === savedFranquiaId)
      if (franquia) {
        setSelectedFranquiaState(franquia)
      } else {
        // Se a franquia salva não existe mais, seleciona "Todos" para produtores ou primeira para outros
        setSelectedFranquiaState(franquiasWithAll[0])
      }
    } else if (franquiasWithAll.length > 0 && !selectedFranquia) {
      // Se não tem franquia salva, seleciona "Todos" para produtores ou primeira para outros
      setSelectedFranquiaState(franquiasWithAll[0])
    }
  }, [franquiasWithAll, isProdutor])

  const setSelectedFranquia = (franquia: Franquia) => {
    setSelectedFranquiaState(franquia)
    localStorage.setItem("selectedFranquiaId", franquia.id)
  }

  return (
    <FranquiaContext.Provider
      value={{
        selectedFranquia,
        setSelectedFranquia,
        availableFranquias: franquiasWithAll,
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
