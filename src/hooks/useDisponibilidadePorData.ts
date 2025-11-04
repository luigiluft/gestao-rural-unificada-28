import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useHorariosRetirada } from "./useConfiguracoesSistema"
import { addDays, format } from "date-fns"

export type DisponibilidadeNivel = 'high' | 'medium' | 'low'

interface DisponibilidadePorData {
  [data: string]: DisponibilidadeNivel
}

export const useDisponibilidadePorData = (
  startDate: Date,
  endDate: Date,
  depositoId?: string
) => {
  const horariosRetirada = useHorariosRetirada()
  const totalHorarios = horariosRetirada.length

  return useQuery({
    queryKey: ["disponibilidade-por-data", format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), depositoId],
    queryFn: async (): Promise<DisponibilidadePorData> => {
      if (!depositoId || totalHorarios === 0) return {}

      const startDateString = format(startDate, 'yyyy-MM-dd')
      const endDateString = format(endDate, 'yyyy-MM-dd')

      // Buscar todas as reservas no período para o depósito
      const { data: reservas, error } = await supabase
        .from("reservas_horario")
        .select("data_saida, horario")
        .eq("deposito_id", depositoId)
        .gte("data_saida", startDateString)
        .lte("data_saida", endDateString)

      if (error) throw error

      // Agrupar reservas por data e contar quantos horários estão ocupados
      const reservasPorData = (reservas || []).reduce((acc, reserva) => {
        if (!acc[reserva.data_saida]) {
          acc[reserva.data_saida] = new Set()
        }
        acc[reserva.data_saida].add(reserva.horario)
        return acc
      }, {} as Record<string, Set<string>>)

      // Calcular disponibilidade para cada data
      const disponibilidade: DisponibilidadePorData = {}
      
      Object.keys(reservasPorData).forEach(data => {
        const horariosOcupados = reservasPorData[data].size
        const horariosDisponiveis = totalHorarios - horariosOcupados
        const percentualDisponivel = (horariosDisponiveis / totalHorarios) * 100

        if (percentualDisponivel >= 60) {
          disponibilidade[data] = 'high'
        } else if (percentualDisponivel >= 30) {
          disponibilidade[data] = 'medium'
        } else {
          disponibilidade[data] = 'low'
        }
      })

      return disponibilidade
    },
    enabled: !!depositoId && totalHorarios > 0,
  })
}
