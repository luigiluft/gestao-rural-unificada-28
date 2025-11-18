import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useFranquias = () => {
  return useQuery({
    queryKey: ["franquias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select(`
          *,
          franquia_usuarios!inner (
            user_id,
            papel,
            ativo,
            profiles (
              nome,
              email
            )
          )
        `)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return data
    },
  })
}
