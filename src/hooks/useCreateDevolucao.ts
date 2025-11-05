import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ItemDevolvido {
  saida_item_id: string
  quantidade: number
}

interface CreateDevolucaoParams {
  ocorrencia_id: string
  saida_id: string
  tipo_devolucao: 'total' | 'parcial'
  itens_devolvidos?: ItemDevolvido[]
  observacoes?: string
}

export const useCreateDevolucao = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: CreateDevolucaoParams) => {
      console.log('🔄 Criando devolução:', params)
      
      const { data, error } = await supabase.functions.invoke('manage-saidas', {
        body: {
          action: 'create_devolucao',
          data: params
        }
      })

      if (error) {
        console.error('❌ Erro na edge function:', error)
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar devolução')
      }

      console.log('✅ Devolução criada:', data.data)
      return data.data
    },
    onSuccess: (data) => {
      const tipoDevolucao = data.tipo_devolucao === 'total' ? 'total' : 'parcial'
      
      toast({
        title: "Devolução criada",
        description: `Devolução ${tipoDevolucao} criada com sucesso. Entrada: ${data.entrada_id.substring(0, 8)}`,
      })
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
      queryClient.invalidateQueries({ queryKey: ["entradas"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao criar devolução:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a devolução",
        variant: "destructive",
      })
    },
  })
}
