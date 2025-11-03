import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useGerarRoyalty } from "./useGerarRoyalty"

export const useInicializarRoyalty = (franquiaId?: string) => {
  const gerarRoyalty = useGerarRoyalty()

  // Buscar contratos ativos da franquia
  const { data: contratos, isLoading: contratosLoading } = useQuery({
    queryKey: ["contratos-franquia-ativos", franquiaId],
    queryFn: async () => {
      if (!franquiaId) return []

      const { data, error } = await supabase
        .from("contrato_franquia")
        .select("id, franquia_id")
        .eq("franquia_id", franquiaId)
        .eq("status", "ativo")

      if (error) throw error
      return data || []
    },
    enabled: !!franquiaId,
  })

  // Buscar royalties em rascunho para cada contrato
  const { data: royaltiesRascunho, isLoading: royaltiesLoading } = useQuery({
    queryKey: ["royalties-rascunho", contratos?.map(c => c.id)],
    queryFn: async () => {
      if (!contratos || contratos.length === 0) return []

      const { data, error } = await supabase
        .from("royalties")
        .select("id, contrato_franquia_id")
        .in("contrato_franquia_id", contratos.map(c => c.id))
        .eq("status", "rascunho")

      if (error) throw error
      return data || []
    },
    enabled: !!contratos && contratos.length > 0,
  })

  // Inicializar royalties automaticamente para contratos sem rascunho
  useEffect(() => {
    if (contratos && contratos.length > 0 && !contratosLoading && !royaltiesLoading && !gerarRoyalty.isPending) {
      // Para cada contrato ativo, verificar se já tem royalty em rascunho
      contratos.forEach(contrato => {
        const temRascunho = royaltiesRascunho?.some(r => r.contrato_franquia_id === contrato.id)
        
        if (!temRascunho) {
          console.log('Inicializando royalty para contrato:', contrato.id)
          gerarRoyalty.mutate({ contrato_franquia_id: contrato.id })
        }
      })
    }
  }, [contratos, royaltiesRascunho, contratosLoading, royaltiesLoading])

  return {
    isInitializing: gerarRoyalty.isPending || contratosLoading || royaltiesLoading,
    contratos,
    royaltiesRascunho,
  }
}
