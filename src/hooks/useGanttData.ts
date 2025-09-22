import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { differenceInDays } from "date-fns"

export interface GanttItem {
  saida_id: string;
  pedido_numero: string;
  cliente_nome: string;
  data_ideal: Date;
  janela_horario?: string;
  data_real?: Date;
  status: string;
  divergencia_dias: number;
  viagem_id?: string;
  produto_descricao?: string;
}

export const useGanttData = (selectedDate?: Date) => {
  return useQuery({
    queryKey: ["gantt-data", selectedDate?.toISOString()],
    queryFn: async () => {
      console.log('🔍 useGanttData: Fetching gantt data...')
      
      let query = supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          janela_horario,
          status,
          viagem_id,
          produtor_destinatario_id,
          observacoes,
          valor_total
        `)
        .order("data_saida", { ascending: true })

      // Filter by date if provided
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0]
        query = query.eq("data_saida", dateStr)
      } else {
        // Get data for current month if no date selected
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const endOfMonth = new Date()
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)
        endOfMonth.setDate(0)
        endOfMonth.setHours(23, 59, 59, 999)
        
        query = query
          .gte("data_saida", startOfMonth.toISOString().split('T')[0])
          .lte("data_saida", endOfMonth.toISOString().split('T')[0])
      }

      const { data: saidas, error: saidasError } = await query

      if (saidasError) {
        console.error('❌ useGanttData: Error fetching saidas:', saidasError)
        throw saidasError
      }

      console.log('✅ useGanttData: Found', saidas?.length || 0, 'saidas')

      if (!saidas || saidas.length === 0) {
        return []
      }

      // Fetch related viagens
      const viagemIds = saidas
        .map(s => s.viagem_id)
        .filter(Boolean)

      let viagens: any[] = []
      if (viagemIds.length > 0) {
        const { data: viagensData, error: viagensError } = await supabase
          .from("viagens")
          .select("id, data_inicio, data_fim, status")
          .in("id", viagemIds)

        if (viagensError) {
          console.error('❌ useGanttData: Error fetching viagens:', viagensError)
        } else {
          viagens = viagensData || []
        }
      }

      // Fetch profiles for client names
      const produtorIds = saidas
        .map(s => s.produtor_destinatario_id)
        .filter(Boolean)

      let profiles: any[] = []
      if (produtorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", produtorIds)

        if (profilesError) {
          console.error('❌ useGanttData: Error fetching profiles:', profilesError)
        } else {
          profiles = profilesData || []
        }
      }

      // Fetch saida items for product description
      const saidaIds = saidas.map(s => s.id)
      const { data: saidaItens, error: itensError } = await supabase
        .from("saida_itens")
        .select(`
          saida_id,
          produto_id,
          produtos(nome)
        `)
        .in("saida_id", saidaIds)

      if (itensError) {
        console.error('❌ useGanttData: Error fetching saida_itens:', itensError)
      }

      // Process data into GanttItem format
      const ganttItems: GanttItem[] = saidas.map(saida => {
        const viagem = viagens.find(v => v.id === saida.viagem_id)
        const profile = profiles.find(p => p.user_id === saida.produtor_destinatario_id)
        const firstItem = saidaItens?.find(item => item.saida_id === saida.id)
        
        const dataIdeal = new Date(saida.data_saida)
        const dataReal = viagem?.data_inicio ? new Date(viagem.data_inicio) : undefined
        
        const divergenciaDias = dataReal 
          ? differenceInDays(dataReal, dataIdeal)
          : 0

        return {
          saida_id: saida.id,
          pedido_numero: `Saída ${saida.id.slice(-8)}`,
          cliente_nome: profile?.nome || 'Cliente não identificado',
          data_ideal: dataIdeal,
          janela_horario: saida.janela_horario,
          data_real: dataReal,
          status: saida.status,
          divergencia_dias: divergenciaDias,
          viagem_id: saida.viagem_id,
          produto_descricao: (firstItem?.produtos as any)?.nome || 'Produto não identificado'
        }
      })

      console.log('✅ useGanttData: Processed', ganttItems.length, 'gantt items')
      return ganttItems
    },
    staleTime: 30000,
  })
}

export const useGanttStats = () => {
  return useQuery({
    queryKey: ["gantt-stats"],
    queryFn: async () => {
      const { data: saidas, error } = await supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          status,
          viagem_id,
          viagens(data_inicio)
        `)

      if (error) throw error

      const totalSaidas = saidas?.length || 0
      const saidasComViagem = saidas?.filter(s => s.viagem_id)?.length || 0
      const saidasSemViagem = totalSaidas - saidasComViagem

      // Calculate divergences
      let noPrazo = 0
      let atrasadas = 0
      let antecipadas = 0

      saidas?.forEach(saida => {
        if (saida.viagem_id && saida.viagens?.data_inicio) {
          const dataIdeal = new Date(saida.data_saida)
          const dataReal = new Date(saida.viagens.data_inicio)
          const diffDays = differenceInDays(dataReal, dataIdeal)

          if (diffDays === 0) noPrazo++
          else if (diffDays > 0) atrasadas++
          else antecipadas++
        }
      })

      return {
        total_saidas: totalSaidas,
        saidas_com_viagem: saidasComViagem,
        saidas_sem_viagem: saidasSemViagem,
        no_prazo: noPrazo,
        atrasadas: atrasadas,
        antecipadas: antecipadas,
        percentual_no_prazo: saidasComViagem > 0 ? Math.round((noPrazo / saidasComViagem) * 100) : 0
      }
    },
    staleTime: 30000,
  })
}