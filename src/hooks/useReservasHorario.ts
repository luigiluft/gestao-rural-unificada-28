import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useHorariosRetirada } from "./useConfiguracoesSistema"

export interface ReservaHorario {
  id: string
  data_saida: string
  horario: string
  saida_id?: string
  user_id: string
  deposito_id: string
  created_at: string
}

export const useReservasHorario = (depositoId?: string) => {
  return useQuery({
    queryKey: ["reservas-horario", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("reservas_horario")
        .select("*")
        .order("data_saida", { ascending: true })

      if (depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!depositoId,
  })
}

export const useHorariosDisponiveis = (dataSaida?: string, depositoId?: string) => {
  const horariosRetirada = useHorariosRetirada()
  
  return useQuery({
    queryKey: ["horarios-disponiveis", dataSaida, depositoId],
    queryFn: async () => {
      if (!dataSaida || !depositoId) return []

      // Buscar horários já reservados para esta data e depósito
      const { data: reservas, error } = await supabase
        .from("reservas_horario")
        .select("horario")
        .eq("data_saida", dataSaida)
        .eq("deposito_id", depositoId)

      if (error) throw error

      const horariosReservados = reservas?.map(r => r.horario) || []
      
      console.log('📅 Horários reservados para', dataSaida, ':', horariosReservados)
      console.log('⏰ Total de horários disponíveis:', horariosRetirada.length - horariosReservados.length)
      
      // Filtrar horários disponíveis (remover os reservados)
      const horariosDisponiveis = horariosRetirada.filter(
        horario => !horariosReservados.includes(horario)
      )

      return horariosDisponiveis
    },
    enabled: !!dataSaida && !!depositoId,
  })
}

export const useDatasSemHorarios = (depositoId?: string) => {
  const horariosRetirada = useHorariosRetirada()
  
  return useQuery({
    queryKey: ["datas-sem-horarios", depositoId],
    queryFn: async () => {
      if (!depositoId) return []

      // Buscar todas as reservas futuras para este depósito
      const hoje = new Date().toISOString().split('T')[0]
      
      const { data: reservas, error } = await supabase
        .from("reservas_horario")
        .select("data_saida, horario")
        .eq("deposito_id", depositoId)
        .gte("data_saida", hoje)

      if (error) throw error

      // Agrupar reservas por data
      const reservasPorData = (reservas || []).reduce((acc, reserva) => {
        if (!acc[reserva.data_saida]) {
          acc[reserva.data_saida] = []
        }
        acc[reserva.data_saida].push(reserva.horario)
        return acc
      }, {} as Record<string, string[]>)

      // Encontrar datas que têm todos os horários ocupados
      const datasSemHorarios = Object.keys(reservasPorData).filter(data => {
        const horariosOcupados = reservasPorData[data]
        return horariosOcupados.length >= horariosRetirada.length
      })

      return datasSemHorarios
    },
    enabled: !!depositoId && horariosRetirada.length > 0,
  })
}

export const useCriarReserva = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      dataSaida,
      horario,
      saidaId,
      depositoId
    }: {
      dataSaida: string
      horario: string
      saidaId?: string
      depositoId: string
    }) => {
      const { data, error } = await supabase
        .from("reservas_horario")
        .insert({
          data_saida: dataSaida,
          horario,
          saida_id: saidaId,
          deposito_id: depositoId,
          user_id: (await supabase.auth.getUser()).data.user?.id!
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas-horario"] })
      queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis"] })
      queryClient.invalidateQueries({ queryKey: ["datas-sem-horarios"] })
    },
    onError: (error: any) => {
      console.error("Erro ao criar reserva:", error)
      
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Horário indisponível",
          description: "Este horário já foi reservado por outro usuário. Selecione outro horário disponível.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro ao reservar horário",
          description: "Ocorreu um erro ao reservar o horário. Tente novamente.",
          variant: "destructive",
        })
      }
    },
  })
}

export const useRemoverReserva = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (saidaId: string) => {
      const { error } = await supabase
        .from("reservas_horario")
        .delete()
        .eq("saida_id", saidaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas-horario"] })
      queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis"] })
      queryClient.invalidateQueries({ queryKey: ["datas-sem-horarios"] })
      
      toast({
        title: "Reserva removida",
        description: "O horário foi liberado com sucesso.",
      })
    },
    onError: (error) => {
      console.error("Erro ao remover reserva:", error)
      toast({
        title: "Erro ao liberar horário",
        description: "Ocorreu um erro ao liberar o horário.",
        variant: "destructive",
      })
    },
  })
}