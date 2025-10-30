import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface AuditPositionMetadata {
  id: string
  codigo: string
  ativo: boolean
  ocupado: boolean
  deposito_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StorageAuditResult {
  success: boolean
  depositoId: string
  franquiaId: string
  masterFranqueadoId: string
  totalPositions: number
  positions: AuditPositionMetadata[]
  auditedAt: string
  auditedBy: string
}

export function useStorageAudit(depositoId?: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ["storage-audit", depositoId],
    queryFn: async (): Promise<StorageAuditResult | null> => {
      if (!depositoId) return null

      const { data, error } = await supabase.functions.invoke('storage-positions-audit', {
        body: { depositoId }
      })

      if (error) {
        console.error('[useStorageAudit] Error:', error)
        throw error
      }

      return data as StorageAuditResult
    },
    enabled: enabled && !!depositoId,
    staleTime: 30000, // 30 seconds
    retry: false
  })
}
