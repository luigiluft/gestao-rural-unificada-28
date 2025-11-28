import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface DepositoDisponivel {
  deposito_id: string;
  deposito_nome: string;
  franqueado_id: string | null;
  franqueado_nome: string;
  tipo_deposito: 'franquia' | 'filial';
}

export const useDepositosDisponiveis = (userId?: string) => {
  return useQuery<DepositoDisponivel[]>({
    queryKey: ["depositos-disponiveis", userId],
    queryFn: async () => {
      if (!userId) return []
      
      // Primeiro, buscar todas as empresas (clientes) que este usuário gerencia
      const { data: clienteUsuarios, error: clienteError } = await supabase
        .from("cliente_usuarios")
        .select("cliente_id")
        .eq("user_id", userId)
        .eq("ativo", true)

      if (clienteError) throw clienteError

      const clienteIds = clienteUsuarios?.map(cu => cu.cliente_id) || []
      if (clienteIds.length === 0) return []

      // 1. Buscar depósitos onde o cliente tem filiais ativas
      const { data: filiaisDepositos, error: filiaisError } = await supabase
        .from("cliente_depositos")
        .select(`
          franquia_id,
          franquias (
            id,
            nome
          )
        `)
        .in("cliente_id", clienteIds)
        .eq("tipo_regime", "filial")
        .eq("ativo", true)

      if (filiaisError) throw filiaisError

      // 2. Buscar depósitos onde o cliente tem estoque em armazém geral
      // Via entrada_pallets (fonte real de estoque atual)
      const { data: palletsEstoque, error: estoqueError } = await supabase
        .from("entrada_pallets")
        .select(`
          id,
          quantidade_atual,
          entradas!inner (
            deposito_id,
            cliente_id
          )
        `)
        .gt("quantidade_atual", 0)

      if (estoqueError) throw estoqueError

      // Filtrar apenas pallets de clientes do usuário e extrair deposito_id únicos
      const depositosArmazemGeral = [...new Set(
        palletsEstoque
          ?.filter(ep => clienteIds.includes(ep.entradas.cliente_id))
          ?.map(ep => ep.entradas.deposito_id)
          ?.filter(Boolean) || []
      )]

      // Buscar informações das franquias dos depósitos com estoque
      let franquiasEstoque: any[] = []
      if (depositosArmazemGeral.length > 0) {
        const { data, error } = await supabase
          .from("franquias")
          .select("id, nome")
          .in("id", depositosArmazemGeral)

        if (error) throw error
        franquiasEstoque = data || []
      }

      // Combinar e remover duplicatas
      const depositosMap = new Map<string, DepositoDisponivel>()

      // Adicionar depósitos de filiais
      filiaisDepositos?.forEach(item => {
        if (item.franquias) {
          depositosMap.set(item.franquia_id, {
            deposito_id: item.franquias.id,
            deposito_nome: item.franquias.nome,
            franqueado_id: null,
            franqueado_nome: item.franquias.nome,
            tipo_deposito: 'filial'
          })
        }
      })

      // Adicionar depósitos com estoque (apenas se não forem filiais)
      franquiasEstoque.forEach(franquia => {
        if (!depositosMap.has(franquia.id)) {
          depositosMap.set(franquia.id, {
            deposito_id: franquia.id,
            deposito_nome: franquia.nome,
            franqueado_id: null,
            franqueado_nome: franquia.nome,
            tipo_deposito: 'franquia'
          })
        }
      })

      return Array.from(depositosMap.values())
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

// Função removida: useRelacionamentosProdutorFranqueado
// Agora todos os produtores têm acesso automático a todas as franquias ativas