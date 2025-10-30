import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface PositionData {
  rua: number
  modulo: number
  andar: number
  ocupado: boolean
  codigo: string
  id: string
  ativo: boolean
  deposito_id: string
  created_at: string
  updated_at: string
  palletInfo?: {
    numero_pallet: number
    descricao: string | null
  } | null
}

interface WarehouseMapData {
  positions: PositionData[]
  dimensions: {
    maxRua: number
    maxModulo: number
    maxAndar: number
  }
  stats: {
    total: number
    ocupadas: number
    livres: number
    ocupacaoPercentual: number
  }
}

function parsePositionCode(codigo: string): { rua: number; modulo: number; andar: number } | null {
  const match = codigo.match(/R(\d+)-M(\d+)-A(\d+)/)
  if (!match) return null
  
  return {
    rua: parseInt(match[1]),
    modulo: parseInt(match[2]),
    andar: parseInt(match[3])
  }
}

export function useWarehouseMap(depositoId?: string, includeInactive: boolean = false) {
  return useQuery({
    queryKey: ["warehouse-map", depositoId, includeInactive],
    queryFn: async (): Promise<WarehouseMapData> => {
      if (!depositoId) {
        return {
          positions: [],
          dimensions: { maxRua: 0, maxModulo: 0, maxAndar: 0 },
          stats: { total: 0, ocupadas: 0, livres: 0, ocupacaoPercentual: 0 }
        }
      }

      let query = supabase
        .from("storage_positions")
        .select(`
          id,
          codigo,
          ocupado,
          ativo,
          deposito_id,
          created_at,
          updated_at,
          pallet_positions (
            id,
            entrada_pallets (
              numero_pallet,
              descricao
            )
          )
        `)
        .eq("deposito_id", depositoId)
      
      if (!includeInactive) {
        query = query.eq("ativo", true)
      }

      const { data: positions, error } = await query

      if (error) throw error

      // Parse códigos e processar dados
      const parsedPositions: PositionData[] = []
      let maxRua = 0
      let maxModulo = 0
      let maxAndar = 0
      let ocupadas = 0

      positions?.forEach((pos: any) => {
        const coords = parsePositionCode(pos.codigo)
        if (!coords) return

        maxRua = Math.max(maxRua, coords.rua)
        maxModulo = Math.max(maxModulo, coords.modulo)
        maxAndar = Math.max(maxAndar, coords.andar)

        if (pos.ocupado) ocupadas++

        const palletInfo = pos.pallet_positions?.[0]?.entrada_pallets
          ? {
              numero_pallet: pos.pallet_positions[0].entrada_pallets.numero_pallet,
              descricao: pos.pallet_positions[0].entrada_pallets.descricao
            }
          : null

        parsedPositions.push({
          ...coords,
          ocupado: pos.ocupado,
          codigo: pos.codigo,
          id: pos.id,
          ativo: pos.ativo,
          deposito_id: pos.deposito_id,
          created_at: pos.created_at,
          updated_at: pos.updated_at,
          palletInfo
        })
      })

      const total = parsedPositions.length
      const livres = total - ocupadas
      const ocupacaoPercentual = total > 0 ? Math.round((ocupadas / total) * 100) : 0

      return {
        positions: parsedPositions,
        dimensions: { maxRua, maxModulo, maxAndar },
        stats: { total, ocupadas, livres, ocupacaoPercentual }
      }
    },
    enabled: !!depositoId
  })
}
