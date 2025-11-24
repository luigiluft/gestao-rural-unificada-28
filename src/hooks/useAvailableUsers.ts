import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useAvailableUsers = () => {
  return useQuery({
    queryKey: ["available-users-franqueado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, role")
        .eq("role", "franqueado")
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
