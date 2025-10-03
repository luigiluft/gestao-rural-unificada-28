import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface FinalizarViagemParams {
  viagemId: string
}

export const useFinalizarViagemAposComprovante = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ viagemId }: FinalizarViagemParams) => {
      console.log('[Finalizar Viagem] Iniciando finalização via Edge Function', { viagemId })

      const { data, error } = await supabase.functions.invoke('manage-viagens', {
        body: {
          action: 'finalizar_viagem',
          data: { viagemId }
        }
      })

      console.log('[Finalizar Viagem] Resposta da Edge Function', { data, error })

      if (error) {
        console.error('[Finalizar Viagem] Erro na Edge Function', error)
        throw error
      }

      if (!data?.success) {
        console.error('[Finalizar Viagem] Edge Function retornou erro', data)
        throw new Error(data?.error || 'Erro ao finalizar viagem')
      }

      return data.data
    },
    onSuccess: () => {
      console.log('[Finalizar Viagem] Viagem finalizada com sucesso')
      toast.success('Viagem finalizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['motorista-viagens'] })
      queryClient.invalidateQueries({ queryKey: ['viagens'] })
    },
    onError: (error: any) => {
      console.error('[Finalizar Viagem] Erro ao finalizar:', error)
      toast.error('Erro ao finalizar viagem: ' + (error?.message || 'erro desconhecido'))
    }
  })
}
