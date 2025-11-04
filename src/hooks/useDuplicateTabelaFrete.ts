import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useDuplicateTabelaFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { originalId: string; novoNome: string }) => {
      // Get original table with its ranges
      const { data: tabelaOriginal, error: fetchError } = await supabase
        .from("tabelas_frete")
        .select(`
          *,
          frete_faixas (*)
        `)
        .eq("id", data.originalId)
        .single()

      if (fetchError) throw fetchError

      // Create new table
      const { data: novaTabela, error: tabelaError } = await supabase
        .from("tabelas_frete")
        .insert({
          user_id: tabelaOriginal.user_id,
          franqueado_id: tabelaOriginal.franqueado_id,
          nome: data.novoNome,
          tipo: tabelaOriginal.tipo,
          origem: tabelaOriginal.origem,
          data_vigencia: tabelaOriginal.data_vigencia,
          valor_base: tabelaOriginal.valor_base,
          ativo: tabelaOriginal.ativo
        })
        .select()
        .single()

      if (tabelaError) throw tabelaError

      // Copy all ranges
      if (tabelaOriginal.frete_faixas && tabelaOriginal.frete_faixas.length > 0) {
        const faixasData = tabelaOriginal.frete_faixas.map((faixa: any) => ({
          tabela_frete_id: novaTabela.id,
          distancia_min: faixa.distancia_min,
          distancia_max: faixa.distancia_max,
          valor_ate_300kg: faixa.valor_ate_300kg,
          valor_por_kg_301_999: faixa.valor_por_kg_301_999,
          pedagio_por_ton: faixa.pedagio_por_ton,
          prazo_dias: faixa.prazo_dias
        }))

        const { error: faixasError } = await supabase
          .from("frete_faixas")
          .insert(faixasData)

        if (faixasError) throw faixasError
      }

      return novaTabela
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] })
      toast({
        title: "Tabela duplicada com sucesso",
        description: "A nova tabela foi criada com todas as faixas de frete."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao duplicar tabela",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}
