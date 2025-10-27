import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export const useDashboardFinanceiro = (meses: number = 12) => {
  return useQuery({
    queryKey: ['dashboard-financeiro', meses],
    queryFn: async () => {
      const now = new Date()
      const startDate = subMonths(startOfMonth(now), meses - 1)

      // Buscar faturas pagas nos últimos N meses
      const { data: faturas, error } = await supabase
        .from('faturas')
        .select(`
          *,
          contratos:contrato_id (
            franquia_id
          ),
          franquias:franquia_id (
            nome
          )
        `)
        .eq('status', 'pago')
        .gte('data_pagamento', startDate.toISOString())
        .order('data_pagamento')

      if (error) throw error

      // Agrupar por mês
      const receitaPorMes = new Map<string, number>()
      
      faturas?.forEach(fatura => {
        const mes = format(new Date(fatura.data_pagamento!), 'yyyy-MM')
        
        const receitaAtual = receitaPorMes.get(mes) || 0
        receitaPorMes.set(mes, receitaAtual + (fatura.valor_servicos || 0))
      })

      // Converter para array
      const mesesArray: string[] = []
      for (let i = 0; i < meses; i++) {
        const mes = format(subMonths(now, meses - 1 - i), 'yyyy-MM')
        mesesArray.push(mes)
      }

      const receitaMensal = mesesArray.map(mes => ({
        mes: format(new Date(mes + '-01'), 'MMM/yy'),
        receita: receitaPorMes.get(mes) || 0,
      }))

      // Totais
      const receitaTotal = Array.from(receitaPorMes.values()).reduce((a, b) => a + b, 0)

      return {
        receitaMensal,
        receitaTotal,
      }
    },
  })
}
