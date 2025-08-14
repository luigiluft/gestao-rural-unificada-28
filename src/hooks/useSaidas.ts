import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useSaidas = () => {
  return useQuery({
    queryKey: ["saidas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saidas")
        .select(`
          *,
          depositos(nome),
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export const useSaidaStats = () => {
  return useQuery({
    queryKey: ["saida-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saidas")
        .select("status, created_at")

      if (error) throw error

      const hoje = new Date().toDateString()
      const saidasHoje = data?.filter(s => 
        new Date(s.created_at).toDateString() === hoje
      ).length || 0

      const preparando = data?.filter(s => s.status === 'preparando').length || 0
      const expedidas = data?.filter(s => s.status === 'expedida').length || 0
      const entregues = data?.filter(s => s.status === 'entregue').length || 0

      return {
        saidasHoje,
        preparando,
        expedidas,
        entregues
      }
    },
  })
}