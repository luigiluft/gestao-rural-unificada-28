import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PalletPendenteItem {
  produto_id: string;
  quantidade: number;
  produtos?: {
    nome: string;
  };
}

export const usePalletsPendentesItems = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pallets-pendentes-items", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      console.log("Fetching produtos em pallets pendentes for user:", user.id);

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      const isAdmin = profile?.role === 'admin';
      console.log("User role:", profile?.role, "Is admin:", isAdmin);

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

      const { data: allPallets, error: palletsError } = await palletQuery;

      if (palletsError) {
        console.error("Error fetching pallets:", palletsError);
        throw palletsError;
      }

      console.log("Found confirmed pallets:", allPallets?.length || 0);

      // Filtrar apenas pallets que não estão alocados
      const { data: allocatedPalletIds, error: allocatedError } = await supabase
        .from("pallet_positions")
        .select("pallet_id")
        .eq("status", "alocado");

      if (allocatedError) {
        console.error("Error fetching allocated pallets:", allocatedError);
      }

      const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || []);
      const pendingPallets = allPallets?.filter(pallet => !allocatedIds.has(pallet.id)) || [];

      console.log("Pallets pendentes filtrados:", pendingPallets.length);

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
        console.error("Error fetching pallet items:", itemsError);
        throw itemsError;
      }

      console.log("Found pallet items:", palletItems?.length || 0);

      // Transformar dados para o formato esperado
      const items: PalletPendenteItem[] = palletItems?.map(item => ({
        produto_id: item.entrada_itens.produto_id,
        quantidade: item.quantidade,
        produtos: item.entrada_itens.produtos
      })) || [];

      console.log("Transformed pallet items:", items.length);
      return items;
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};