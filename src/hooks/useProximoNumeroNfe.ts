import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export function useProximoNumeroNfe(serie: string = '1', depositoId?: string) {
  return useQuery({
    queryKey: ['proximo-numero-nfe', serie, depositoId],
    queryFn: async () => {
      // Buscar o maior número de NFe para a série especificada
      const { data, error } = await supabase
        .from('saidas')
        .select('numero_nfe')
        .eq('serie_nfe', serie)
        .not('numero_nfe', 'is', null)
        .order('numero_nfe', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao buscar último número NFe:', error)
        return '1'
      }

      if (data && data.length > 0 && data[0].numero_nfe) {
        const ultimoNumero = parseInt(data[0].numero_nfe, 10)
        return String(ultimoNumero + 1)
      }

      return '1'
    },
    enabled: !!serie,
    staleTime: 0, // Sempre buscar novo para garantir sequência correta
  })
}
