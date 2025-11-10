import { useUserRole } from './useUserRole'
import { getRoleLabel } from '@/utils/roleTranslations'

/**
 * Hook para obter o label traduzido do role do usuário atual
 * @param plural - Se true, retorna versão plural
 * @param short - Se true, retorna versão abreviada
 */
export const useRoleLabel = (plural = false, short = false) => {
  const { userRole, isLoading } = useUserRole()
  
  return {
    roleLabel: getRoleLabel(userRole, plural, short),
    isLoading
  }
}
