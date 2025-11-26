import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

interface StatusCount {
  status: string
  entradas: number
  saidas: number
  total: number
}

export const useWMSFluxo = () => {
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["wms-fluxo", depositoId],
    queryFn: async () => {
      // Buscar todas as entradas e saídas
      let entradasQuery = supabase.from("entradas").select("status_aprovacao, deposito_id")
      let saidasQuery = supabase.from("saidas").select("status, deposito_id")
      
      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        entradasQuery = entradasQuery.eq("deposito_id", depositoId)
        saidasQuery = saidasQuery.eq("deposito_id", depositoId)
      }
      
      const [entradasResult, saidasResult] = await Promise.all([
        entradasQuery,
        saidasQuery
      ])

      if (entradasResult.error) throw entradasResult.error
      if (saidasResult.error) throw saidasResult.error

      const entradas = entradasResult.data || []
      const saidas = saidasResult.data || []

      // Definir a ordem dos status
      const statusOrder = [
        // Entradas
        { key: 'aguardando_transporte', label: 'Aguardando Transporte', type: 'entrada' },
        { key: 'em_transferencia', label: 'Em Transferência', type: 'entrada' },
        { key: 'planejamento', label: 'Planejamento', type: 'entrada' },
        { key: 'recebido', label: 'Recebido', type: 'entrada' },
        // Saídas
        { key: 'separacao_pendente', label: 'Separação Pendente', type: 'saida' },
        { key: 'separado', label: 'Separado', type: 'saida' },
        { key: 'expedido', label: 'Expedido', type: 'saida' },
        { key: 'entregue', label: 'Entregue', type: 'saida' },
      ]

      // Contar por status
      const statusCounts: StatusCount[] = statusOrder.map(({ key, label, type }) => {
        const entradasCount = type === 'entrada' 
          ? entradas.filter(e => e.status_aprovacao === key).length 
          : 0
        const saidasCount = type === 'saida' 
          ? saidas.filter(s => s.status === key).length 
          : 0

        return {
          status: label,
          entradas: entradasCount,
          saidas: saidasCount,
          total: entradasCount + saidasCount
        }
      })

      return statusCounts
    },
    staleTime: 30000, // 30 segundos
  })
}
