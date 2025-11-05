import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ConfiguracaoPriorizacao {
  id: string
  franquia_id: string
  modo_priorizacao: 'fifo' | 'customizado'
  fatores: any[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export const usePriorizacaoConfig = (franquiaId?: string) => {
  return useQuery({
    queryKey: ["priorizacao-config", franquiaId],
    queryFn: async (): Promise<ConfiguracaoPriorizacao | null> => {
      if (!franquiaId) return null

      const { data, error } = await supabase
        .from("configuracoes_priorizacao_separacao")
        .select("*")
        .eq("franquia_id", franquiaId)
        .eq("ativo", true)
        .maybeSingle()

      if (error) throw error
      return data as ConfiguracaoPriorizacao | null
    },
    enabled: !!franquiaId,
  })
}

export const useUpdatePriorizacaoConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      franquiaId,
      modoPriorizacao,
      fatores,
    }: {
      franquiaId: string
      modoPriorizacao: 'fifo' | 'customizado'
      fatores: any[]
    }) => {
      const { error } = await supabase
        .from("configuracoes_priorizacao_separacao")
        .upsert({
          franquia_id: franquiaId,
          modo_priorizacao: modoPriorizacao,
          fatores,
          ativo: true,
        }, {
          onConflict: 'franquia_id,ativo'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priorizacao-config"] })
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes"] })
      toast.success("Configuração de priorização salva com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao salvar configuração:", error)
      toast.error("Erro ao salvar configuração de priorização")
    }
  })
}