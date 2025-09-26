import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, differenceInDays } from "date-fns"

export interface AgendaItem {
  saida_id: string
  viagem_id?: string
  data_ideal: string
  data_planejada?: string
  data_fim_planejada?: string
  janela_horario?: string
  status_saida: string
  status_viagem?: string
  cliente_nome: string
  cliente_telefone?: string
  endereco?: string
  produto_descricao?: string
  valor_total?: number
  divergencia_dias?: number
  tipo_divergencia: 'ok' | 'pequena' | 'grande' | 'sem_planejamento'
}

export const useAgendaData = (selectedDate?: Date) => {
  return useQuery({
    queryKey: ["agenda-data", selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      console.log('🔍 useAgendaData: Starting query for date:', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all dates')
      const dateFilter = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
      
      let query = supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          janela_horario,
          status,
          valor_total,
          viagem_id,
          observacoes,
          produtor_destinatario_id
        `)

      if (dateFilter) {
        console.log('🔍 useAgendaData: Applying date filter for:', dateFilter)
        query = query.eq('data_saida', dateFilter)
      }
      
      query = query.order("data_saida", { ascending: true })

      console.log('🔍 useAgendaData: Executing query...')
      const { data: saidasData, error } = await query

      console.log('🔍 useAgendaData: Query result:', { data: saidasData?.length, error })
      if (error) {
        console.error('❌ useAgendaData: Query error:', error)
        throw error
      }

      if (!saidasData || saidasData.length === 0) {
        console.log('🔍 useAgendaData: No saidas found')
        return []
      }

      // Buscar dados das viagens separadamente
      const viagemIds = saidasData.map(s => s.viagem_id).filter(Boolean)
      const { data: viagensData } = viagemIds.length > 0 ? await supabase
        .from("viagens")
        .select("id, data_inicio, data_fim, status")
        .in("id", viagemIds) : { data: [] }

      // Buscar profiles separadamente
      const produtorIds = saidasData.map(s => s.produtor_destinatario_id).filter(Boolean)
      const { data: profilesData } = produtorIds.length > 0 ? await supabase
        .from("profiles")
        .select("user_id, nome, telefone")
        .in("user_id", produtorIds) : { data: [] }

      // Buscar saida_itens separadamente
      const saidaIds = saidasData.map(s => s.id)
      const { data: itensData } = await supabase
        .from("saida_itens")
        .select("saida_id, produto_id, quantidade")
        .in("saida_id", saidaIds)

      // Buscar produtos se houver itens
      const produtoIds = itensData?.map(item => item.produto_id).filter(Boolean) || []
      const { data: produtosData } = produtoIds.length > 0 ? await supabase
        .from("produtos")
        .select("id, nome")
        .in("id", produtoIds) : { data: [] }

      console.log('🔍 useAgendaData: Processing', saidasData.length, 'saidas with related data')

      const agendaItems: AgendaItem[] = saidasData.map(saida => {
        // Encontrar viagem relacionada
        const viagem = viagensData?.find(v => v.id === saida.viagem_id)
        
        // Encontrar profile relacionado
        const profile = profilesData?.find(p => p.user_id === saida.produtor_destinatario_id)
        
        // Consolidar produtos para esta saída
        const saidaItens = itensData?.filter(item => item.saida_id === saida.id) || []
        const produtos = saidaItens.map(item => {
          const produto = produtosData?.find(p => p.id === item.produto_id)
          return produto?.nome || 'Produto não especificado'
        }).filter(Boolean).join(', ') || 'Produto não especificado'
        
        // Calcular divergência
        let divergencia_dias = 0
        let tipo_divergencia: AgendaItem['tipo_divergencia'] = 'sem_planejamento'
        
        if (viagem?.data_inicio && saida.data_saida) {
          divergencia_dias = differenceInDays(new Date(viagem.data_inicio), new Date(saida.data_saida))
          
          if (divergencia_dias === 0) {
            tipo_divergencia = 'ok'
          } else if (Math.abs(divergencia_dias) <= 3) {
            tipo_divergencia = 'pequena'
          } else {
            tipo_divergencia = 'grande'
          }
        }

        return {
          saida_id: saida.id,
          viagem_id: viagem?.id,
          data_ideal: saida.data_saida,
          data_planejada: viagem?.data_inicio,
          data_fim_planejada: viagem?.data_fim,
          janela_horario: saida.janela_horario,
          status_saida: saida.status,
          status_viagem: viagem?.status,
          cliente_nome: profile?.nome || 'Cliente não informado',
          cliente_telefone: profile?.telefone,
          endereco: 'Endereço será definido conforme dados do cliente',
          produto_descricao: produtos,
          valor_total: saida.valor_total,
          divergencia_dias,
          tipo_divergencia
        }
      })

      console.log('🔍 useAgendaData: Processed items:', agendaItems.length, 'items')
      return agendaItems
    },
    staleTime: 30000,
  })
}

export const useAgendaStats = () => {
  return useQuery({
    queryKey: ["agenda-stats"],
    queryFn: async () => {
      // Buscar estatísticas gerais das saídas sem JOINs problemáticos
      const { data: saidasData, error } = await supabase
        .from("saidas")
        .select("id, data_saida, status, viagem_id")

      if (error) throw error

      if (!saidasData) {
        return {
          total_saidas: 0,
          com_viagem: 0,
          sem_viagem: 0,
          no_prazo: 0,
          atrasadas: 0,
          adiantadas: 0
        }
      }

      // Buscar dados das viagens separadamente
      const viagemIds = saidasData.map(s => s.viagem_id).filter(Boolean)
      const { data: viagensData } = viagemIds.length > 0 ? await supabase
        .from("viagens")
        .select("id, data_inicio")
        .in("id", viagemIds) : { data: [] }

      const stats = {
        total_saidas: saidasData.length,
        com_viagem: saidasData.filter(s => s.viagem_id).length,
        sem_viagem: saidasData.filter(s => !s.viagem_id).length,
        no_prazo: 0,
        atrasadas: 0,
        adiantadas: 0
      }

      // Calcular estatísticas de prazo
      saidasData.forEach(saida => {
        if (saida.viagem_id) {
          const viagem = viagensData?.find(v => v.id === saida.viagem_id)
          if (viagem?.data_inicio && saida.data_saida) {
            const diff = differenceInDays(new Date(viagem.data_inicio), new Date(saida.data_saida))
            if (diff === 0) stats.no_prazo++
            else if (diff > 0) stats.atrasadas++
            else stats.adiantadas++
          }
        }
      })

      return stats
    },
    staleTime: 60000,
  })
}