import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useSaidas = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["saidas", dateRange],
    queryFn: async () => {
      console.log('=== HOOK DEBUG - useSaidas ===')
      console.log('dateRange:', dateRange)
      
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

      console.log('Query inicial montada')
      
      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString())
        console.log('Filtro from aplicado:', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte("created_at", endDate.toISOString())
        console.log('Filtro to aplicado:', endDate.toISOString())
      }

      console.log('Executando query principal...')
      const { data: saidasData, error: saidasError } = await query.order("created_at", { ascending: false })

      console.log('Resultado da query:', { saidasData, saidasError })
      
      if (saidasError) {
        console.error('Erro na query principal:', saidasError)
        throw saidasError
      }

      console.log('Saídas encontradas:', saidasData?.length || 0)

      // Para cada saída, buscar o nome da franquia
      console.log('Iniciando busca de franquias...')
      const saidasComDeposito = await Promise.all(
        (saidasData || []).map(async (saida, index) => {
          console.log(`Processando saída ${index + 1}:`, saida.id)
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