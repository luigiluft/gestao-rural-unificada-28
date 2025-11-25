import { useFranquia } from "@/contexts/FranquiaContext"
import { useUserRole } from "./useUserRole"

/**
 * Hook utilitário para gerenciar filtros de depósito
 * Usado para filtrar dados por depósito selecionado
 */
export const useDepositoFilter = () => {
  const { selectedFranquia } = useFranquia()
  const { isCliente } = useUserRole()
  
  return {
    depositoId: selectedFranquia?.id === "ALL" ? null : selectedFranquia?.id,
    isAllDeposits: selectedFranquia?.id === "ALL",
    shouldFilter: isCliente && selectedFranquia?.id !== "ALL",
    hasFilter: !!selectedFranquia && selectedFranquia.id !== "ALL"
  }
}
