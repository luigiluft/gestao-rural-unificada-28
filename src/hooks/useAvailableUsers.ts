import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

/**
 * Hook para buscar usuários disponíveis para associar a franquias
 * Agora busca clientes ao invés de operadores após a migração de roles
 */
export const useAvailableUsers = () => {
  return useQuery({
    queryKey: ["available-users-cliente"],
    queryFn: async () => {
      // Buscar todos os usuários clientes que podem ser associados a franquias
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, role")
        .eq("role", "cliente")
        .order("nome")

      if (error) throw error
      
      return data.map(user => ({
        user_id: user.user_id,
        nome: user.nome,
        email: user.email,
        role: user.role
      }))
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}
