import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PalletDetailItem {
  id: string;
  quantidade: number;
  entrada_itens: {
    nome_produto: string;
    lote?: string;
    data_validade?: string;
    produtos?: {
      nome: string;
      codigo?: string;
    };
  };
}

export const usePalletDetails = (palletId?: string) => {
  return useQuery({
    queryKey: ["pallet-details", palletId],
    queryFn: async () => {
      if (!palletId) return null;

      const { data, error } = await supabase
        .from("entrada_pallet_itens")
        .select(`
          id,
          quantidade,
          entrada_itens (
            nome_produto,
            lote,
            data_validade,
            produtos (
              nome,
              codigo
            )
          )
        `)
        .eq("pallet_id", palletId);

      if (error) throw error;
      return data as PalletDetailItem[];
    },
    enabled: !!palletId,
  });
};