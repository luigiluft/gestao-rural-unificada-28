import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useDepositoFilter } from "./useDepositoFilter"

interface DateRange {
  from?: Date
  to?: Date
}

export const useSaidasPendentes = (dateRange?: DateRange) => {
  const { depositoId, shouldFilter } = useDepositoFilter()

  return useQuery({
    queryKey: ["saidas-pendentes", dateRange, depositoId],
    queryFn: async () => {
      let query = supabase
        .from("saidas")
        .select(`
          *,
          prioridade_calculada,
          scores_fatores,
          tags,
          saida_itens (
            *,
            produtos (
              nome,
              unidade_medida,
              containers_per_package,
              package_capacity
            )
          )
        `)
        .in("status", ["separacao_pendente", "separado", "expedido", "entregue"])
        .is("viagem_id", null)
      
      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("data_saida", dateRange.from.toISOString().split('T')[0])
      }
      if (dateRange?.to) {
        query = query.lte("data_saida", dateRange.to.toISOString().split('T')[0])
      }

      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }
      
      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar saídas pendentes:", error)
        throw error
      }

      // Buscar os produtores separadamente
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id).filter(Boolean))]
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", userIds)

        // Mapear os profiles para as saídas e ordenar por prioridade
        const saidasComProdutor = data.map(saida => ({
          ...saida,
          produtor: profiles?.find(p => p.user_id === saida.user_id) || null
        }))

        // Ordenar: primeiro por prioridade (se existir), depois por created_at
        return saidasComProdutor.sort((a, b) => {
          if (a.prioridade_calculada !== null && b.prioridade_calculada !== null) {
            return b.prioridade_calculada - a.prioridade_calculada
          }
          if (a.prioridade_calculada !== null) return -1
          if (b.prioridade_calculada !== null) return 1
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      }

      return data || []
    },
  })
}

export const useAtualizarStatusSaida = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      saidaId,
      status,
      observacoes,
    }: {
      saidaId: string
      status: string
      observacoes?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-saidas', {
        body: {
          action: 'update_status',
          data: {
            id: saidaId,
            status: status as "separacao_pendente" | "separado" | "expedido" | "entregue",
            observacoes
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar status da saída')
      }

      return data
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Status atualizado",
        description: `Saída atualizada para ${getStatusLabel(variables.status)}`,
      })
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
      queryClient.invalidateQueries({ queryKey: ["saida-stats"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error) => {
      console.error("Erro ao atualizar status da saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da saída",
        variant: "destructive",
      })
    },
  })
}

const getStatusLabel = (status: string) => {
  const statusLabels = {
    'separacao_pendente': 'Separação Pendente',
    'separado': 'Separado',
    'expedido': 'Expedido',
    'entregue': 'Entregue'
  }
  return statusLabels[status as keyof typeof statusLabels] || status
}