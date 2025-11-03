import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAtualizarFatura } from "./useAtualizarFatura"

export const useInicializarFatura = (userId?: string) => {
  const atualizarFatura = useAtualizarFatura()

  // Buscar contrato ativo do usuário
  const { data: contrato, isLoading: contratoLoading } = useQuery({
    queryKey: ["contrato-ativo", userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from("contratos_servico")
        .select("id, status")
        .eq("produtor_id", userId)
        .eq("status", "ativo")
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  // Buscar fatura em rascunho
  const { data: faturaRascunho, isLoading: faturaLoading } = useQuery({
    queryKey: ["fatura-rascunho", contrato?.id],
    queryFn: async () => {
      if (!contrato?.id) return null

      const { data, error } = await supabase
        .from("faturas")
        .select("id")
        .eq("contrato_id", contrato.id)
        .eq("status", "rascunho")
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!contrato?.id,
  })

  // Inicializar/atualizar fatura automaticamente
  useEffect(() => {
    if (contrato?.id && !contratoLoading && !faturaLoading && !atualizarFatura.isPending) {
      // Sempre atualizar a fatura ao carregar a página
      atualizarFatura.mutate(contrato.id)
    }
  }, [contrato?.id, contratoLoading, faturaLoading])

  return {
    isInitializing: atualizarFatura.isPending || contratoLoading || faturaLoading,
    contrato,
    faturaRascunho,
  }
}
