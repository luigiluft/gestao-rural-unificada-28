import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useContratoDetalhes = (contratoId: string | undefined) => {
  return useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: async () => {
      if (!contratoId) throw new Error('ID do contrato é obrigatório')

      const { data: contrato, error: contratoError } = await supabase
        .from('contratos_servico')
        .select(`
          *,
          franquias:franquia_id (
            id,
            nome,
            cnpj,
            endereco
          ),
          produtor:profiles!produtor_id (
            nome,
            cpf_cnpj,
            email,
            telefone
          )
        `)
        .eq('id', contratoId)
        .maybeSingle()

      if (contratoError) throw contratoError

      // Buscar serviços
      const { data: servicos, error: servicosError } = await supabase
        .from('contrato_servicos_itens')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('created_at')

      if (servicosError) throw servicosError

      // Buscar SLAs
      const { data: slas, error: slasError } = await supabase
        .from('contrato_sla')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('created_at')

      if (slasError) throw slasError

      // Buscar janelas de entrega
      const { data: janelas, error: janelasError } = await supabase
        .from('contrato_janelas_entrega')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('dia_semana')

      if (janelasError) throw janelasError

      // Buscar faturas
      const { data: faturas, error: faturasError } = await supabase
        .from('faturas')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('data_emissao', { ascending: false })

      if (faturasError) throw faturasError

      return {
        contrato,
        servicos: servicos || [],
        slas: slas || [],
        janelas: janelas || [],
        faturas: faturas || [],
      }
    },
    enabled: !!contratoId,
  })
}
