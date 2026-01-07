import { useDeposito } from "@/contexts/DepositoContext"
import { useFranquia } from "@/contexts/FranquiaContext"
import { useUserRole } from "./useUserRole"

/**
 * Hook utilitário para gerenciar filtros de depósito
 * Para clientes: usa o DepositoContext (baseado em cliente_depositos)
 * Para outros usuários: usa o FranquiaContext (baseado em franquia_usuarios)
 */
export const useDepositoFilter = () => {
  const { isCliente } = useUserRole()
  
  // Para clientes, usar DepositoContext
  const depositoContext = useDeposito()
  
  // Para franqueados/operadores, usar FranquiaContext
  const franquiaContext = useFranquia()
  
  // Determinar qual contexto usar baseado no papel do usuário
  if (isCliente) {
    const deposito = depositoContext.selectedDeposito
    return {
      depositoId: deposito?.id === "ALL" ? null : deposito?.franquia_id,
      isAllDeposits: deposito?.id === "ALL",
      shouldFilter: !!deposito && deposito.id !== "ALL",
      hasFilter: !!deposito && deposito.id !== "ALL",
      // Dados adicionais do depósito do cliente
      clienteDepositoId: deposito?.id === "ALL" ? null : deposito?.id,
      depositoNome: deposito?.nome,
    }
  }
  
  // Para franqueados, operadores e admins
  const franquia = franquiaContext.selectedFranquia
  return {
    depositoId: franquia?.id === "ALL" ? null : franquia?.id,
    isAllDeposits: franquia?.id === "ALL",
    shouldFilter: !!franquia && franquia.id !== "ALL",
    hasFilter: !!franquia && franquia.id !== "ALL",
    clienteDepositoId: null,
    depositoNome: franquia?.nome,
  }
}
