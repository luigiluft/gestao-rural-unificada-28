import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface DepositoDisponivel {
  deposito_id: string;
  deposito_nome: string;
  franqueado_id: string | null;
  franqueado_nome: string;
  tipo_deposito: 'franquia' | 'filial' | 'armazem_geral';
}

export const useDepositosDisponiveis = (userId?: string) => {
  return useQuery<DepositoDisponivel[]>({
    queryKey: ["depositos-disponiveis", userId],
    queryFn: async () => {
      if (!userId) return []
      
      // Buscar clientes do usuário diretamente
      const { data: clienteUsuarios, error: clienteError } = await supabase
        .from("cliente_usuarios")
        .select("cliente_id")
        .eq("user_id", userId)
        .eq("ativo", true)

      if (clienteError) throw clienteError

      const clienteIds = clienteUsuarios?.map(cu => cu.cliente_id) || []
      if (clienteIds.length === 0) return []

      // Buscar TODOS os depósitos dos clientes
      const { data: clienteDepositos, error: depositosError } = await supabase
        .from("cliente_depositos")
        .select(`
          id,
          nome,
          tipo_regime,
          franquia_id,
          franquias (
            id,
            nome
          )
        `)
        .in("cliente_id", clienteIds)
        .eq("ativo", true)

      if (depositosError) throw depositosError

      // Mapear depósitos para o formato esperado
      const depositos: DepositoDisponivel[] = []

      clienteDepositos?.forEach(dep => {
        if (dep.franquias) {
          depositos.push({
            deposito_id: dep.franquia_id,
            deposito_nome: dep.nome || dep.franquias.nome,
            franqueado_id: null,
            franqueado_nome: dep.franquias.nome,
            tipo_deposito: dep.tipo_regime === 'filial' ? 'filial' : 'armazem_geral'
          })
        }
      })

      return depositos
    },
    enabled: !!userId,
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