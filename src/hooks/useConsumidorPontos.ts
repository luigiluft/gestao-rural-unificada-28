import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export interface ConsumidorPontos {
  id: string
  user_id: string
  saldo_atual: number
  updated_at: string
}

export interface PontosHistorico {
  id: string
  user_id: string
  tipo: 'credito' | 'debito'
  quantidade: number
  origem: string | null
  referencia_id: string | null
  descricao: string | null
  created_at: string
}

export const useConsumidorPontos = () => {
  const { user } = useAuth()

  const pontosQuery = useQuery({
    queryKey: ["consumidor-pontos", user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from("consumidor_pontos")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data as ConsumidorPontos | null
    },
    enabled: !!user?.id,
  })

  const historicoQuery = useQuery({
    queryKey: ["consumidor-pontos-historico", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("consumidor_pontos_historico")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data as PontosHistorico[]
    },
    enabled: !!user?.id,
  })

  return {
    saldo: pontosQuery.data?.saldo_atual ?? 0,
    historico: historicoQuery.data ?? [],
    isLoading: pontosQuery.isLoading || historicoQuery.isLoading,
  }
}
