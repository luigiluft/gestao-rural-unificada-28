import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useDepositosDisponiveis = (produtorId?: string) => {
  return useQuery({
    queryKey: ["depositos-disponiveis", produtorId],
    queryFn: async () => {
      if (!produtorId) return []
      
      const { data, error } = await supabase.rpc(
        'get_producer_available_deposits',
        { _producer_id: produtorId }
      )

      if (error) throw error
      return data || []
    },
    enabled: !!produtorId,
  })
}

export const useDepositosFranqueado = () => {
  return useQuery({
    queryKey: ["depositos-franqueado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depositos")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || '')
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return data || []
    },
  })
}

export const useRelacionamentosProdutorFranqueado = () => {
  return useQuery({
    queryKey: ["relacionamentos-produtor-franqueado"],
    queryFn: async () => {
      const { data: relations, error } = await supabase
        .from("produtor_franqueado_depositos")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      if (!relations || relations.length === 0) return []

      // Get related data
      const produtorIds = relations.map(r => r.produtor_id)
      const depositoIds = relations.map(r => r.deposito_id)
      
      const [produtores, depositos] = await Promise.all([
        supabase.from("profiles").select("user_id, nome, email").in("user_id", produtorIds),
        supabase.from("depositos").select("id, nome").in("id", depositoIds)
      ])

      // Combine data
      const result = relations.map(rel => ({
        ...rel,
        produtor: produtores.data?.find(p => p.user_id === rel.produtor_id),
        depositos: depositos.data?.find(d => d.id === rel.deposito_id)
      }))

      return result
    },
  })
}