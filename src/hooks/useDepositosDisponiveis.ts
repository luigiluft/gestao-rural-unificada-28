import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useClientes } from "@/hooks/useClientes"

interface DepositoDisponivel {
  deposito_id: string;
  deposito_nome: string;
  franqueado_id: string | null;
  franqueado_nome: string;
  tipo_deposito: 'franquia' | 'filial' | 'armazem_geral';
}

export const useDepositosDisponiveis = (userId?: string) => {
  const { data: clientes } = useClientes()
  
  return useQuery<DepositoDisponivel[]>({
    queryKey: ["depositos-disponiveis", userId, clientes?.map(c => c.id)],
    queryFn: async () => {
      if (!userId) return []
      
      // Pegar os IDs dos clientes que o usuário gerencia
      const clienteIds = clientes?.map(c => c.id) || []
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
      const depositosMap = new Map<string, DepositoDisponivel>()

      clienteDepositos?.forEach(dep => {
        if (dep.franquias) {
          depositosMap.set(dep.id, {
            deposito_id: dep.franquia_id,
            deposito_nome: dep.nome || dep.franquias.nome,
            franqueado_id: null,
            franqueado_nome: dep.franquias.nome,
            tipo_deposito: dep.tipo_regime === 'filial' ? 'filial' : 'armazem_geral'
          })
        }
      })

      return Array.from(depositosMap.values())
    },
    enabled: !!userId && !!clientes && clientes.length > 0,
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