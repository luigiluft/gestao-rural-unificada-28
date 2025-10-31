import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useFaturaMutations = () => {
  const queryClient = useQueryClient()

  const gerarFatura = useMutation({
    mutationFn: async (contratoId: string) => {
      const { data, error } = await supabase.functions.invoke('gerar-fatura', {
        body: { contrato_id: contratoId }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
      queryClient.invalidateQueries({ queryKey: ['contrato'] })
      toast.success('Fatura gerada com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao gerar fatura: ' + error.message)
    },
  })

  const registrarPagamento = useMutation({
    mutationFn: async ({ faturaId, dataPagamento, valorPago }: { 
      faturaId: string
      dataPagamento: string
      valorPago: number 
    }) => {
      const { error } = await supabase
        .from('faturas')
        .update({ 
          status: 'pago',
          data_pagamento: dataPagamento
        })
        .eq('id', faturaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
      toast.success('Pagamento registrado com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message)
    },
  })

  const cancelarFatura = useMutation({
    mutationFn: async (faturaId: string) => {
      const { error } = await supabase
        .from('faturas')
        .update({ status: 'cancelado' })
        .eq('id', faturaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
      toast.success('Fatura cancelada com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao cancelar fatura: ' + error.message)
    },
  })

  const fecharFatura = useMutation({
    mutationFn: async (faturaId: string) => {
      const { data, error } = await supabase.functions.invoke('fechar-fatura', {
        body: { fatura_id: faturaId },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
      toast.success('Fatura fechada com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao fechar fatura: ' + error.message)
    },
  })

  return {
    gerarFatura,
    registrarPagamento,
    cancelarFatura,
    fecharFatura,
  }
}
