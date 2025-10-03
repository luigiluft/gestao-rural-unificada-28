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

      console.log('[Finalizar Viagem] Resposta completa da Edge Function', { 
        data, 
        error,
        hasData: !!data,
        hasError: !!error,
        dataSuccess: data?.success,
        dataError: data?.error
      })

      if (error) {
        console.error('[Finalizar Viagem] Erro HTTP na chamada da Edge Function', error)
        throw new Error(`Erro HTTP: ${error.message || JSON.stringify(error)}`)
      }

      if (!data?.success) {
        console.error('[Finalizar Viagem] Edge Function retornou erro no payload', {
          data,
          errorMessage: data?.error
        })
        throw new Error(data?.error || 'Erro ao finalizar viagem')
      }

      console.log('[Finalizar Viagem] Viagem finalizada com sucesso na Edge Function', data.data)
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
