import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useSaidas = () => {
  return useQuery({
    queryKey: ["saidas"],
    queryFn: async () => {
      // Primeiro buscar as saídas com itens
      const { data: saidasData, error: saidasError } = await supabase
        .from("saidas")
        .select(`
          *,
          saida_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)
        .order("created_at", { ascending: false })

      if (saidasError) throw saidasError

      // Para cada saída, buscar o nome do depósito/franquia
      const saidasComDeposito = await Promise.all(
        (saidasData || []).map(async (saida) => {
          let depositoNome = null

          // Primeiro tentar buscar em depositos
          const { data: deposito } = await supabase
            .from("depositos")
            .select("nome")
            .eq("id", saida.deposito_id)
            .single()

          if (deposito) {
            depositoNome = deposito.nome
          } else {
            // Se não encontrar em depositos, tentar em franquias
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