import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para buscar o preço de venda de um produto do cliente
 * Usa preco_promocional se disponível, senão preco_unitario
 */
export const useProductSalePrice = (produtoId?: string) => {
  return useQuery({
    queryKey: ["produto-sale-price", produtoId],
    queryFn: async () => {
      if (!produtoId) return null;

      const { data, error } = await supabase
        .from("cliente_produtos")
        .select("preco_unitario, preco_promocional")
        .eq("id", produtoId)
        .maybeSingle();

      if (error || !data) return null;

      // Usar preço promocional se existir, senão preço unitário
      return data.preco_promocional ?? data.preco_unitario ?? null;
    },
    enabled: !!produtoId,
  });
};
