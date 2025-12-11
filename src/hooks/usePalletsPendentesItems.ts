import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepositoFilter } from "./useDepositoFilter";

interface PalletPendenteItem {
  produto_id: string;
  quantidade: number;
  produtos?: {
    nome: string;
  };
}

export const usePalletsPendentesItems = () => {
  const { user } = useAuth();
  const { depositoId, shouldFilter } = useDepositoFilter();

  return useQuery({
    queryKey: ["pallets-pendentes-items", user?.id, depositoId],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const isAdmin = profile?.role === 'admin';

      // Buscar pallets confirmados que ainda não foram alocados
      let palletQuery = supabase
        .from("entrada_pallets")
        .select(`
          id,
          entradas!inner (
            id,
            user_id,
            deposito_id,
            status_aprovacao
          )
        `)
        .eq("entradas.status_aprovacao", "confirmado");

      // If not admin, filter by user_id
      if (!isAdmin) {
        palletQuery = palletQuery.eq("entradas.user_id", user.id);
      }
      
      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        palletQuery = palletQuery.eq("entradas.deposito_id", depositoId);
      }

      const { data: allPallets, error: palletsError } = await palletQuery;

      if (palletsError) {
        throw palletsError;
      }

      // Filter out pallets that already have ANY record in pallet_positions (unique constraint)
      const { data: allocatedPalletIds, error: allocatedError } = await supabase
        .from("pallet_positions")
        .select("pallet_id");

      if (allocatedError) {
        throw allocatedError;
      }

      const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || []);
      const pendingPallets = allPallets?.filter(pallet => !allocatedIds.has(pallet.id)) || [];

      if (pendingPallets.length === 0) {
        return [];
      }

      // Buscar itens dos pallets pendentes
      const { data: palletItems, error: itemsError } = await supabase
        .from("entrada_pallet_itens")
        .select(`
          quantidade,
          entrada_itens!inner (
            produto_id,
            produtos (
              nome
            )
          )
        `)
        .in("pallet_id", pendingPallets.map(p => p.id));

      if (itemsError) {
        throw itemsError;
      }

      // Transformar dados para o formato esperado
      const items: PalletPendenteItem[] = palletItems?.map(item => ({
        produto_id: item.entrada_itens?.produto_id,
        quantidade: item.quantidade,
        produtos: item.entrada_itens?.produtos
      })) || [];

      return items;
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 0, // Always refetch for fresh data
  });
};