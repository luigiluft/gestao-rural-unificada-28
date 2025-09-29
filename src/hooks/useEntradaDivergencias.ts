import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface EntradaDivergencia {
  id: string
  entrada_id: string
  produto_id: string | null
  tipo_divergencia: string
  quantidade_esperada: number
  quantidade_encontrada: number
  diferenca: number
  lote?: string
  observacoes?: string
  status: string
  tipo_origem: string
  prioridade: string
  valor_impacto?: number
  created_at: string
  updated_at: string
}

export const useEntradaDivergencias = (entradaId: string) => {
  return useQuery({
    queryKey: ["entrada-divergencias", entradaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divergencias")
        .select("*")
        .eq("entrada_id", entradaId)
        .eq("tipo_origem", "entrada")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as EntradaDivergencia[]
    },
    enabled: !!entradaId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Helper function to group divergencias by produto and lote
export const groupDivergenciasByProductAndLote = (divergencias: EntradaDivergencia[]) => {
  const grouped: { [key: string]: EntradaDivergencia[] } = {}
  
  divergencias.forEach(div => {
    const key = `${div.produto_id || 'sem_produto'}-${div.lote || 'sem_lote'}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(div)
  })
  
  return grouped
}

// Helper function to calculate total quantity adjustment for a product/lote
export const calculateQuantityAdjustment = (
  productId: string,
  lote: string | undefined,
  divergencias: EntradaDivergencia[]
) => {
  let quantityAdjustment = 0
  let hasAvaria = false
  let avariaQuantity = 0
  
  divergencias.forEach(div => {
    // Match by produto_id and lote (if provided)
    const matchesProduct = !div.produto_id || div.produto_id === productId
    const matchesLote = !div.lote || !lote || div.lote === lote
    
    if (matchesProduct && matchesLote) {
      if (div.tipo_divergencia === 'quantidade_incorreta') {
        // For quantity divergences, use diferenca directly (positive or negative)
        // diferenca = quantidade_recebida - quantidade_esperada
        // If -20, we received 20 less, so subtract from available
        quantityAdjustment += Math.abs(div.diferenca || 0)
      } else if (div.tipo_divergencia === 'produto_avariado' || div.tipo_divergencia === 'avaria') {
        hasAvaria = true
        // For avaria, quantidade_encontrada is the damaged quantity
        avariaQuantity += Number(div.quantidade_encontrada || 0)
      }
    }
  })
  
  return {
    quantityAdjustment, // Amount to subtract from original quantity
    hasAvaria,
    avariaQuantity // Amount that is damaged and needs separate pallet
  }
}