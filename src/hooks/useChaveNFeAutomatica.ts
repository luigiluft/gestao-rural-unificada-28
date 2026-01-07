import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { gerarChaveNFe, ResultadoChaveNFe } from "@/lib/chave-nfe"

interface UseChaveNFeAutomaticaParams {
  depositoId?: string
  serie: string
  numeroNfe: string
  enabled?: boolean
}

/**
 * Hook para gerar automaticamente a Chave de Acesso NF-e
 * Busca CNPJ e UF do depósito selecionado e gera a chave
 */
export function useChaveNFeAutomatica({
  depositoId,
  serie,
  numeroNfe,
  enabled = true
}: UseChaveNFeAutomaticaParams) {
  // Buscar dados do depósito (franquia) para obter CNPJ e UF
  const { data: depositoData, isLoading } = useQuery({
    queryKey: ['deposito-dados-nfe', depositoId],
    queryFn: async () => {
      if (!depositoId) return null

      const { data, error } = await supabase
        .from('franquias')
        .select('cnpj, estado')
        .eq('id', depositoId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar dados do depósito para NFe:', error)
        return null
      }

      return data
    },
    enabled: !!depositoId && enabled
  })

  // Gerar a chave quando todos os dados estiverem disponíveis
  const resultado: ResultadoChaveNFe | null = useMemo(() => {
    if (!depositoData?.cnpj || !depositoData?.estado || !serie || !numeroNfe) {
      return null
    }

    return gerarChaveNFe({
      uf: depositoData.estado,
      cnpj: depositoData.cnpj,
      serie: serie,
      numeroNfe: numeroNfe,
      dataEmissao: new Date()
    })
  }, [depositoData?.cnpj, depositoData?.estado, serie, numeroNfe])

  return {
    chave: resultado?.chave || '',
    valido: resultado?.valido || false,
    erro: resultado?.erro,
    componentes: resultado?.componentes,
    isLoading
  }
}
