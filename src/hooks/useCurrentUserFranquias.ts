import { useAuth } from "@/contexts/AuthContext"
import { useUserFranquias } from "./useFranquiaUsuarios"
import { useMemo } from "react"

/**
 * Hook para obter as franquias do usuário autenticado
 */
export const useCurrentUserFranquias = () => {
  const { user } = useAuth()
  const { data: franquiaUsuarios, isLoading } = useUserFranquias(user?.id)

  const franquias = useMemo(() => {
    return franquiaUsuarios?.map(fu => ({
      ...fu.franquias,
      papel: fu.papel,
      franquia_usuario_id: fu.id
    })) || []
  }, [franquiaUsuarios])

  const isMaster = useMemo(() => {
    return franquiaUsuarios?.some(fu => fu.papel === 'master') || false
  }, [franquiaUsuarios])

  const masterFranquias = useMemo(() => {
    return franquiaUsuarios
      ?.filter(fu => fu.papel === 'master')
      .map(fu => fu.franquias) || []
  }, [franquiaUsuarios])

  return {
    franquias,
    isMaster,
    masterFranquias,
    isLoading,
    hasMultipleFranquias: franquias.length > 1
  }
}
