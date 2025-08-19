import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DateRange {
  from?: Date
  to?: Date
}

export const useSaidasPendentes = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["saidas-pendentes", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("saidas")
        .select(`
          *,
          saida_itens (
            *,
            produtos (
              nome,
              unidade_medida
            )
          )
        `)
        .in("status", ["separacao_pendente", "separado", "expedido"])
        
      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("data_saida", dateRange.from.toISOString().split('T')[0])
      }
      if (dateRange?.to) {
        query = query.lte("data_saida", dateRange.to.toISOString().split('T')[0])
      }
      
      const { data, error } = await query.order("created_at", { ascending: false })

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

        // Mapear os profiles para as saídas
        return data.map(saida => ({
          ...saida,
          produtor: profiles?.find(p => p.user_id === saida.user_id) || null
        }))
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
      const { data, error } = await supabase
        .from("saidas")
        .update({
          status: status as "separacao_pendente" | "separado" | "expedido" | "entregue",
          observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", saidaId)
        .select()
        .single()

      if (error) throw error
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