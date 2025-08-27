import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Hook para listar posições de pallets
export const usePalletPositions = (depositoId?: string) => {
  return useQuery({
    queryKey: ["pallet-positions", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("pallet_positions")
        .select(`
          *,
          entrada_pallets!inner (
            id,
            numero_pallet,
            descricao,
            peso_total,
            entrada_id,
            entradas!inner (
              id,
              deposito_id,
              numero_nfe,
              user_id
            )
          ),
          storage_positions (
            id,
            codigo,
            deposito_id,
            ativo
          )
        `)
        .eq("status", "alocado");

      if (depositoId) {
        query = query.eq("entrada_pallets.entradas.deposito_id", depositoId);
      }

      const { data, error } = await query.order("alocado_em", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });
};

// Hook para pallets pendentes de alocação 
export const usePalletsPendentes = (depositoId?: string) => {
  return useQuery({
    queryKey: ["pallets-pendentes", depositoId],
    queryFn: async () => {
      let query = supabase
        .from("entrada_pallets")
        .select(`
          *,
          entradas!inner (
            id,
            deposito_id,
            numero_nfe,
            user_id,
            status_aprovacao
          ),
          entrada_pallet_itens (
            id,
            quantidade,
            entrada_itens (
              nome_produto,
              quantidade,
              lote,
              valor_unitario,
              data_validade
            )
          )
        `)
        .eq("entradas.status_aprovacao", "confirmado")
        .is("pallet_positions.pallet_id", null); // Pallets sem posição alocada

      if (depositoId) {
        query = query.eq("entradas.deposito_id", depositoId);
      }

      const { data: allData, error } = await query.order("created_at", { ascending: true });

      if (error) throw error;

      // Filter out pallets that are already allocated
      const { data: allocatedPalletIds } = await supabase
        .from("pallet_positions")
        .select("pallet_id")
        .eq("status", "alocado");

      const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || []);
      const data = allData?.filter(pallet => !allocatedIds.has(pallet.id)) || [];

      return data;
    },
  });
};

// Hook para alocar pallet
export const useAllocatePallet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      palletId,
      posicaoId,
      observacoes,
    }: {
      palletId: string;
      posicaoId: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase.rpc("allocate_pallet_to_position", {
        p_pallet_id: palletId,
        p_posicao_id: posicaoId,
        p_observacoes: observacoes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pallet-positions"] });
      queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
      toast({
        title: "Sucesso",
        description: "Pallet alocado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao alocar pallet:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alocar pallet",
        variant: "destructive",
      });
    },
  });
};

// Hook para criar estoque do pallet
export const useCreateStockFromPallet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (palletId: string) => {
      const { data, error } = await supabase.rpc("create_stock_from_pallet", {
        p_pallet_id: palletId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast({
        title: "Sucesso",
        description: "Estoque criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar estoque:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar estoque do pallet",
        variant: "destructive",
      });
    },
  });
};

// Hook para remover alocação de pallet
export const useRemovePalletAllocation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (palletId: string) => {
      // Primeiro, marcar posição como desocupada
      const { data: palletPosition } = await supabase
        .from("pallet_positions")
        .select("posicao_id")
        .eq("pallet_id", palletId)
        .eq("status", "alocado")
        .single();

      if (palletPosition) {
        await supabase
          .from("storage_positions")
          .update({ ocupado: false, updated_at: new Date().toISOString() })
          .eq("id", palletPosition.posicao_id);
      }

      // Depois, marcar pallet como removido
      const { error } = await supabase
        .from("pallet_positions")
        .update({ status: "removido", updated_at: new Date().toISOString() })
        .eq("pallet_id", palletId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pallet-positions"] });
      queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
      toast({
        title: "Sucesso",
        description: "Alocação removida com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao remover alocação:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover alocação",
        variant: "destructive",
      });
    },
  });
};