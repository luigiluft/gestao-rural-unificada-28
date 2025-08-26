import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useEstoquePosicao = (posicaoId?: string) => {
  return useQuery({
    queryKey: ["estoque-posicao", posicaoId],
    queryFn: async () => {
      if (!posicaoId) return []
      
      // Buscar produtos na posição através dos pallets alocados
      const { data, error } = await supabase
        .from("allocation_wave_pallets")
        .select(`
          produtos_conferidos,
          entrada_pallet_id
        `)
        .eq("posicao_id", posicaoId)
        .in("status", ["alocado", "com_divergencia"])

      if (error) throw error
      
      // Processar produtos conferidos para extrair informações
      const produtosNaPosicao = []
      for (const pallet of data || []) {
        if (pallet.produtos_conferidos) {
          const produtos = Array.isArray(pallet.produtos_conferidos) 
            ? pallet.produtos_conferidos 
            : JSON.parse(pallet.produtos_conferidos as string)
          
          for (const produto of produtos) {
            if (produto.status === 'conferido' && produto.quantidade_conferida > 0) {
              // Buscar detalhes do produto
              const { data: produtoData } = await supabase
                .from("produtos")
                .select("nome, codigo")
                .eq("id", produto.produto_id)
                .single()
              
              // Buscar user_id do pallet
              const { data: palletData } = await supabase
                .from("entrada_pallets")
                .select(`
                  entradas (user_id)
                `)
                .eq("id", pallet.entrada_pallet_id)
                .single()
              
              produtosNaPosicao.push({
                id: produto.produto_id,
                produtos: produtoData,
                quantidade_atual: produto.quantidade_conferida,
                lote: produto.lote,
                valor_medio: produto.valor_unitario,
                user_id: palletData?.entradas?.user_id
              })
            }
          }
        }
      }
      
      return produtosNaPosicao
    },
    enabled: !!posicaoId,
  })
}