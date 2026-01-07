import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useMemo } from "react"

/**
 * Hook para obter os depósitos/franquias do usuário autenticado
 * Refatorado para usar cliente_depositos ao invés de franquia_usuarios
 */
export const useCurrentUserFranquias = (limit = 50) => {
  const { user } = useAuth()

  const { data: depositos, isLoading } = useQuery({
    queryKey: ["user-depositos", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return []

      // Buscar clientes do usuário
      const { data: clienteUsuarios } = await supabase
        .from("cliente_usuarios")
        .select("cliente_id, papel")
        .eq("user_id", user.id)
        .eq("ativo", true)

      const clienteIds = clienteUsuarios?.map(cu => cu.cliente_id) || []
      if (clienteIds.length === 0) return []

      // Buscar depósitos dos clientes
      const { data: clienteDepositos } = await supabase
        .from("cliente_depositos")
        .select(`
          id,
          franquia_id,
          nome,
          franquias (
            id,
            nome,
            cnpj
          )
        `)
        .in("cliente_id", clienteIds)
        .eq("ativo", true)
        .limit(limit)

      return clienteDepositos || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const franquias = useMemo(() => {
    if (!depositos) return []
    
    return depositos.map(dep => ({
      id: dep.franquia_id,
      nome: dep.franquias?.nome || dep.nome,
      cnpj: dep.franquias?.cnpj,
      papel: 'operador' as const,
      franquia_usuario_id: dep.id
    }))
  }, [depositos])

  const isMaster = useMemo(() => {
    return false // Conceito de master foi removido
  }, [])

  const masterFranquias = useMemo(() => {
    return [] // Conceito de master foi removido
  }, [])

  return {
    franquias,
    isMaster,
    masterFranquias,
    isLoading,
    hasMultipleFranquias: franquias.length > 1,
    totalFranquias: franquias.length
  }
}
