import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface Agendamento {
  id: string
  user_id: string
  tipo: string
  numero: string
  cliente_nome: string
  cliente_telefone?: string
  cliente_email?: string
  endereco: string
  data_agendamento: string
  horario_agendamento: string
  status: string
  prioridade: string
  produto_descricao?: string
  observacoes?: string
  responsavel_id?: string
  data_conclusao?: string
  created_at: string
  updated_at: string
}

export const useAgendamentos = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ["agendamentos", dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: true })
        .order("horario_agendamento", { ascending: true })

      if (dataInicio) {
        query = query.gte("data_agendamento", dataInicio)
      }
      if (dataFim) {
        query = query.lte("data_agendamento", dataFim)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

export const useAgendamentosByDate = (data: string) => {
  return useQuery({
    queryKey: ["agendamentos", "by-date", data],
    queryFn: async () => {
      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("data_agendamento", data)
        .order("horario_agendamento", { ascending: true })

      if (error) throw error
      return agendamentos || []
    },
    enabled: !!data,
  })
}

export const useCriarAgendamento = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (agendamento: Omit<Agendamento, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("agendamentos")
        .insert({
          ...agendamento,
          user_id: (await supabase.auth.getUser()).data.user?.id!
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] })
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      })
    },
    onError: (error) => {
      console.error("Erro ao criar agendamento:", error)
      toast({
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro ao criar o agendamento.",
        variant: "destructive",
      })
    },
  })
}

export const useAtualizarAgendamento = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Agendamento> & { id: string }) => {
      const { data, error } = await supabase
        .from("agendamentos")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] })
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar agendamento:", error)
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Ocorreu um erro ao atualizar o agendamento.",
        variant: "destructive",
      })
    },
  })
}