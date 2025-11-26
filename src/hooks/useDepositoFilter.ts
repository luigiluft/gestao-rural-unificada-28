import { useFranquia } from "@/contexts/FranquiaContext"


/**
 * Hook utilitário para gerenciar filtros de depósito
 * Usado para filtrar dados por depósito selecionado
 */
export const useDepositoFilter = () => {
  const { selectedFranquia } = useFranquia()
  
  return {
    depositoId: selectedFranquia?.id === "ALL" ? null : selectedFranquia?.id,
    isAllDeposits: selectedFranquia?.id === "ALL",
    // Aplica filtro sempre que houver um depósito específico selecionado
    shouldFilter: !!selectedFranquia && selectedFranquia.id !== "ALL",
    hasFilter: !!selectedFranquia && selectedFranquia.id !== "ALL"
  }
}
