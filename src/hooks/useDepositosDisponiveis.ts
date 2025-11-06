import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface DepositoDisponivel {
  deposito_id: string;
  deposito_nome: string;
  franqueado_id: string | null;
  franqueado_nome: string;
  tipo_deposito: 'franquia' | 'filial';
}

export const useDepositosDisponiveis = (produtorId?: string) => {
  return useQuery<DepositoDisponivel[]>({
    queryKey: ["depositos-disponiveis", produtorId],
    queryFn: async () => {
      if (!produtorId) return []
      
      const { data, error } = await supabase.rpc(
        'get_producer_available_deposits',
        { _producer_id: produtorId }
      )

      if (error) throw error
      return (data || []) as DepositoDisponivel[]
    },
    enabled: !!produtorId,
  })
}

export const useDepositosFranqueado = () => {
  return useQuery({
    queryKey: ["franquias-franqueado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select("*")
        .eq("master_franqueado_id", (await supabase.auth.getUser()).data.user?.id || '')
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return data || []
    },
  })
}

export const useTodasFranquias = () => {
  return useQuery({
    queryKey: ["todas-franquias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select("*")
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      return data || []
    },
  })
}

// Função removida: useRelacionamentosProdutorFranqueado
// Agora todos os produtores têm acesso automático a todas as franquias ativas