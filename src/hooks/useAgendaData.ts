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
          produtor_destinatario_id,
          viagens:viagem_id (
            id,
            data_inicio,
            data_fim,
            status
          ),
          profiles:produtor_destinatario_id (
            nome,
            telefone
          ),
          saida_itens (
            produto_id,
            quantidade,
            produtos (
              nome
            )
          )
        `)
        .order("data_saida", { ascending: true })

      if (dateFilter) {
        query = query.or(`data_saida.eq.${dateFilter},viagens.data_inicio.eq.${dateFilter}`)
      }

      const { data, error } = await query

      if (error) throw error

      const agendaItems: AgendaItem[] = (data || []).map(saida => {
        const viagem = Array.isArray(saida.viagens) ? saida.viagens[0] : saida.viagens
        const profile = Array.isArray(saida.profiles) ? saida.profiles[0] : saida.profiles
        
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

        // Consolidar produtos
        const produtos = saida.saida_itens?.map(item => 
          Array.isArray(item.produtos) ? item.produtos[0]?.nome : item.produtos?.nome
        ).filter(Boolean).join(', ') || 'Produto não especificado'

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

      return agendaItems
    },
    staleTime: 30000,
  })
}

export const useAgendaStats = () => {
  return useQuery({
    queryKey: ["agenda-stats"],
    queryFn: async () => {
      // Buscar estatísticas gerais das saídas
      const { data, error } = await supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          status,
          viagem_id,
          viagens:viagem_id (
            data_inicio
          )
        `)

      if (error) throw error

      const stats = {
        total_saidas: data?.length || 0,
        com_viagem: data?.filter(s => s.viagem_id).length || 0,
        sem_viagem: data?.filter(s => !s.viagem_id).length || 0,
        no_prazo: 0,
        atrasadas: 0,
        adiantadas: 0
      }

      // Calcular estatísticas de prazo
      data?.forEach(saida => {
        const viagem = Array.isArray(saida.viagens) ? saida.viagens[0] : saida.viagens
        if (viagem?.data_inicio && saida.data_saida) {
          const diff = differenceInDays(new Date(viagem.data_inicio), new Date(saida.data_saida))
          if (diff === 0) stats.no_prazo++
          else if (diff > 0) stats.atrasadas++
          else stats.adiantadas++
        }
      })

      return stats
    },
    staleTime: 60000,
  })
}