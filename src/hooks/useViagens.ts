import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useViagens = () => {
  return useQuery({
    queryKey: ["viagens"],
    queryFn: async () => {
      console.log('🔍 useViagens: Fetching viagens...')
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 useViagens: Current session:', session?.user?.id)
      
      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .order("created_at", { ascending: false })

      console.log('🔍 useViagens: Query result:', { data, error })
      
      if (error) {
        console.error('❌ useViagens: Error fetching viagens:', error)
        throw error
      }
      
      console.log('✅ useViagens: Found', data?.length || 0, 'viagens')
      return data || []
    },
    staleTime: 30000,
  })
}

export const useViagemById = (id: string) => {
  return useQuery({
    queryKey: ["viagem", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}