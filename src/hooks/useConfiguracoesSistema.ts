import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface ConfiguracaoSistema {
  id: string
  chave: string
  valor: string
  descricao?: string
  created_at: string
  updated_at: string
}

export const useConfiguracoesSistema = () => {
  return useQuery({
    queryKey: ["configuracoes-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_sistema")
        .select("*")
        .order("chave")

      if (error) throw error
      return data || []
    },
  })
}

export const useConfiguracao = (chave: string) => {
  const { data: configuracoes = [] } = useConfiguracoesSistema()
  const config = configuracoes.find(c => c.chave === chave)
  
  return {
    valor: config?.valor,
    isLoading: !configuracoes.length,
  }
}

export const useUpdateConfiguracao = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { error } = await supabase
        .from("configuracoes_sistema")
        .update({ valor })
        .eq("chave", chave)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-sistema"] })
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi atualizada com sucesso.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Ocorreu um erro ao atualizar a configuração.",
        variant: "destructive",
      })
      console.error("Erro ao atualizar configuração:", error)
    },
  })
}

// Hook para obter peso mínimo MOPP
export const usePesoMinimoMopp = () => {
  const { valor } = useConfiguracao("peso_minimo_mopp")
  return parseInt(valor || "1000")
}

// Hook para obter horários de retirada
export const useHorariosRetirada = () => {
  const { valor } = useConfiguracao("horarios_retirada")
  try {
    return JSON.parse(valor || "[]") as string[]
  } catch {
    return []
  }
}