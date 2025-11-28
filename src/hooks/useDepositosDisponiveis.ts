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
      // Via entradas que têm itens e estoque atual > 0
      const { data: entradasDepositos, error: entradasError } = await supabase
        .from("entradas")
        .select("deposito_id")
        .in("cliente_id", clienteIds)
        .not("deposito_id", "is", null)

      if (entradasError) throw entradasError

      // Obter IDs únicos de depósitos com entradas
      const depositosComEntradas = [...new Set(entradasDepositos?.map(e => e.deposito_id).filter(Boolean) || [])]

      // Verificar quais desses depósitos têm estoque atual
      const { data: estoqueMovs, error: estoqueError } = await supabase
        .from("movimentacoes")
        .select("deposito_id")
        .eq("user_id", userId)
        .gt("quantidade_atual", 0)

      if (estoqueError) throw estoqueError

      const depositosComEstoque = [...new Set(estoqueMovs?.map(m => m.deposito_id).filter(Boolean) || [])]

      // Combinar depósitos com entradas e estoque
      const depositosArmazemGeral = depositosComEntradas.filter(d => depositosComEstoque.includes(d))

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