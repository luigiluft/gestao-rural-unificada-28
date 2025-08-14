import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useProfile = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
}

export const useProdutores = () => {
  return useQuery({
    queryKey: ["produtores-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .eq("role", "produtor")
        .order("nome")

      if (error) throw error
      return data || []
    },
  })
}