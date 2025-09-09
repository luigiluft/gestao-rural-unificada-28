import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useSaidas = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["saidas", dateRange],
    queryFn: async () => {
      // Primeiro buscar as saídas com itens
      let query = supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)

      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte("created_at", endDate.toISOString())
      }

      const { data: saidasData, error: saidasError } = await query.order("created_at", { ascending: false })

      if (saidasError) throw saidasError

      // Para cada saída, buscar o nome da franquia
      const saidasComDeposito = await Promise.all(
        (saidasData || []).map(async (saida) => {
          let depositoNome = null

          if (saida.deposito_id) {
            // Buscar nome da franquia
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", saida.deposito_id)
              .single()

            if (franquia) {
              depositoNome = franquia.nome
            }
          }

          return {
            ...saida,
            depositos: depositoNome ? { nome: depositoNome } : null
          }
        })
      )

      return saidasComDeposito
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Force fresh data every time
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

      const separacaoPendente = data?.filter(s => s.status === 'separacao_pendente').length || 0
      const expedidas = data?.filter(s => s.status === 'expedido').length || 0
      const entregues = data?.filter(s => s.status === 'entregue').length || 0

      return {
        saidasHoje,
        preparando: separacaoPendente,
        expedidas,
        entregues
      }
    },
  })
}