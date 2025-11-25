import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export interface ProdutoAvariado {
  pallet_id: string
  entrada_item_id: string
  quantidade: number
  created_at: string
  entrada_itens?: {
    produto_id: string
    nome_produto: string
    codigo_produto?: string
    lote?: string
    valor_unitario?: number
    produtos?: {
      nome: string
      codigo?: string
      unidade_medida: string
    }
  }
  entrada_pallets?: {
    entrada_id: string
    numero_pallet: number
    entradas?: {
      deposito_id: string
      user_id: string
      data_entrada: string
    }
  }
  franquias?: {
    nome: string
  }
}

export const useProdutosAvariados = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["produtos-avariados", user?.id],
    queryFn: async (): Promise<ProdutoAvariado[]> => {
      if (!user?.id) throw new Error("User not authenticated")

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      const isAdmin = profile?.role === 'admin'

      // Buscar itens de pallet avariados
      let query = supabase
        .from("entrada_pallet_itens")
        .select(`
          pallet_id,
          entrada_item_id,
          quantidade,
          created_at,
          entrada_itens!inner (
            produto_id,
            nome_produto,
            codigo_produto,
            lote,
            valor_unitario,
            produtos (
              nome,
              codigo,
              unidade_medida
            )
          ),
          entrada_pallets!inner (
            entrada_id,
            numero_pallet,
            entradas!inner (
              deposito_id,
              user_id,
              data_entrada
            )
          )
        `)
        .eq("is_avaria", true)

      // If not admin, filter by deposito_id based on user role
      if (!isAdmin) {
        // Check if user is franqueado
        if (profile?.role === 'operador') {
          // Get franquias where user is master_franqueado_id
          const { data: franquias } = await supabase
            .from("franquias")
            .select("id")
            .eq("master_franqueado_id", user.id)
          
          if (franquias && franquias.length > 0) {
            const depositoIds = franquias.map(f => f.id)
            query = query.in("entrada_pallets.entradas.deposito_id", depositoIds)
          } else {
            // If no franquias found, return empty result
            query = query.eq("entrada_pallets.entradas.deposito_id", "00000000-0000-0000-0000-000000000000")
          }
        } else {
          // For produtor role, filter by user_id
          query = query.eq("entrada_pallets.entradas.user_id", user.id)
        }
      }

      const { data: avariados, error } = await query

      if (error) {
        throw error
      }

      // Buscar nomes das franquias para cada item
      const avariasWithFranquias = await Promise.all(
        (avariados || []).map(async (avaria) => {
          const depositoId = avaria.entrada_pallets?.entradas?.deposito_id
          if (depositoId) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", depositoId)
              .single()
            
            return {
              ...avaria,
              franquias: franquia
            }
          }
          return avaria
        })
      )

      return avariasWithFranquias || []
    },
    enabled: !!user?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}