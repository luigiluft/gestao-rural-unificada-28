import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface PalletAllocationResult {
  pallet_id: string;
  posicao_id: string;
  pallet_codigo?: string;
  posicao_codigo?: string;
  codigo_barras_pallet?: string;
  codigo_barras_posicao?: string;
  position?: any;
  success?: boolean;
  data?: any;
}

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
            ),
            entrada_pallet_itens (
              id,
              quantidade,
              is_avaria,
              entrada_itens (
                id,
                produto_id,
                nome_produto,
                lote,
                data_validade,
                unidade_comercial,
                produtos (
                  id,
                  nome,
                  codigo,
                  unidade_medida
                )
              )
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
      
      // Filtrar pallets que não são exclusivamente avariados
      const filteredData = data?.filter(position => {
        const items = position.entrada_pallets?.entrada_pallet_itens || [];
        // Manter apenas pallets que têm pelo menos um item não avariado
        return items.some((item: any) => !item.is_avaria);
      }) || [];
      
      return filteredData;
    },
    enabled: true,
  });
};

// Hook para listar posições de pallets avariados
export const usePalletPositionsAvariados = (depositoId?: string) => {
  return useQuery({
    queryKey: ["pallet-positions-avariados", depositoId],
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
            ),
            entrada_pallet_itens!inner (
              id,
              quantidade,
              is_avaria,
              entrada_itens (
                id,
                produto_id,
                nome_produto,
                lote,
                data_validade,
                unidade_comercial,
                produtos (
                  id,
                  nome,
                  codigo,
                  unidade_medida
                )
              )
            )
          ),
          storage_positions (
            id,
            codigo,
            deposito_id,
            ativo
          )
        `)
        .eq("status", "alocado")
        .eq("entrada_pallets.entrada_pallet_itens.is_avaria", true);

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
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pallets-pendentes", depositoId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const isAdmin = profile?.role === "admin";

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
            is_avaria,
            entrada_itens (
              id,
              nome_produto,
              quantidade,
              lote,
              valor_unitario,
              data_validade,
              unidade_comercial,
              produto_id,
              produtos (
                id,
                nome,
                codigo,
                unidade_medida
              )
            )
          )
        `)
        .eq("entradas.status_aprovacao", "confirmado");

      // Apply franchise filtering for non-admin users
      if (!isAdmin) {
        const { data: franquias } = await supabase
          .from("franquias")
          .select("id")
          .eq("master_franqueado_id", user.id);
        
        const franquiaIds = franquias?.map(f => f.id) || [];
        if (franquiaIds.length > 0) {
          query = query.in("entradas.deposito_id", franquiaIds);
        } else {
          // If user has no franchises, return empty array
          return [];
        }
      }

      if (depositoId) {
        query = query.eq("entradas.deposito_id", depositoId);
      }

      const { data: allData, error } = await query.order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      // Filter out pallets that are already allocated
      const { data: allocatedPalletIds, error: allocatedError } = await supabase
        .from("pallet_positions")
        .select("pallet_id")
        .eq("status", "alocado");

      if (allocatedError) {
        throw allocatedError;
      }

      const allocatedIds = new Set(allocatedPalletIds?.map(p => p.pallet_id) || []);
      const data = allData?.filter(pallet => !allocatedIds.has(pallet.id)) || [];
      
      return data;
    },
    enabled: !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ["warehouse-map"] });
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

// Hook para alocação automática de pallet (apenas reserva posição)
export const useAutoAllocatePallet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      palletId,
      depositoId,
    }: {
      palletId: string;
      depositoId: string;
    }) => {
      // Buscar a primeira posição disponível ordenada por código
      const { data: positions, error: positionError } = await supabase
        .from("storage_positions")
        .select("*")
        .eq("deposito_id", depositoId)
        .eq("ativo", true)
        .eq("ocupado", false)
        .order("codigo", { ascending: true })
        .limit(1);

      if (positionError) throw positionError;
      if (!positions || positions.length === 0) {
        throw new Error("Não há posições disponíveis no depósito");
      }

      const selectedPosition = positions[0];

      // Apenas reservar temporariamente (não alocar ainda)
      const { error: updateError } = await supabase
        .from("storage_positions")
        .update({ 
          reservado_temporariamente: true,
          reservado_ate: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
        })
        .eq("id", selectedPosition.id);

      if (updateError) throw updateError;
      
      return {
        pallet_id: palletId,
        posicao_id: selectedPosition.id,
        pallet_codigo: `PALLET-${palletId.substring(0, 8)}`,
        posicao_codigo: selectedPosition.codigo,
        success: true,
        position: selectedPosition
      } as PalletAllocationResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
      toast({
        title: "Posição Reservada",
        description: `Posição ${result.posicao_codigo} reservada temporariamente`,
      });
    },
    onError: (error) => {
      console.error("Erro ao reservar posição:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao reservar posição",
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
      queryClient.invalidateQueries({ queryKey: ["warehouse-map"] });
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

// Hook para realocar pallet para nova posição
export const useReallocatePallet = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      palletId,
      newPositionId,
      observacoes
    }: {
      palletId: string;
      newPositionId: string;
      observacoes?: string;
    }) => {
      // Verificar se a nova posição está disponível
      const { data: newPosition, error: newPositionError } = await supabase
        .from("storage_positions")
        .select("*")
        .eq("id", newPositionId)
        .eq("ativo", true)
        .eq("ocupado", false)
        .single();

      if (newPositionError) throw newPositionError;
      if (!newPosition) throw new Error("Posição não está disponível");

      // Encontrar a posição atual do pallet
      const { data: currentPosition, error: currentPositionError } = await supabase
        .from("pallet_positions")
        .select("posicao_id")
        .eq("pallet_id", palletId)
        .eq("status", "alocado")
        .single();

      if (currentPositionError) throw currentPositionError;

      // Liberar a posição atual
      const { error: freeCurrentError } = await supabase
        .from("storage_positions")
        .update({ ocupado: false })
        .eq("id", currentPosition.posicao_id);

      if (freeCurrentError) throw freeCurrentError;

      // Ocupar a nova posição
      const { error: occupyNewError } = await supabase
        .from("storage_positions")
        .update({ ocupado: true })
        .eq("id", newPositionId);

      if (occupyNewError) throw occupyNewError;

      // Atualizar a alocação do pallet
      const { error: updatePalletError } = await supabase
        .from("pallet_positions")
        .update({ 
          posicao_id: newPositionId,
          observacoes: observacoes || null,
          alocado_em: new Date().toISOString(),
          alocado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("pallet_id", palletId);

      if (updatePalletError) throw updatePalletError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pallet-positions"] });
      queryClient.invalidateQueries({ queryKey: ["available-positions"] });
      queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-map"] });
      toast({
        title: "Pallet realocado",
        description: "O pallet foi realocado para a nova posição com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao realocar pallet",
        description: error.message || "Ocorreu um erro ao realocar o pallet",
        variant: "destructive",
      });
    },
  });
};

// Hook para confirmar alocação de pallet
export const useConfirmPalletAllocation = (options?: { invalidateOnSuccess?: boolean }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const shouldInvalidate = options?.invalidateOnSuccess ?? true;

  return useMutation({
    mutationFn: async ({ 
      palletId, 
      positionId,
      method,
      palletCode,
      positionCode
    }: {
      palletId: string;
      positionId: string;
      method: "manual" | "scanner";
      palletCode?: string;
      positionCode?: string;
    }) => {
      // Para método scanner, validar códigos
      if (method === "scanner") {
        // Buscar códigos esperados
        const { data: positionData } = await supabase
          .from("storage_positions")
          .select("codigo")
          .eq("id", positionId)
          .single();

        const { data: palletData } = await supabase
          .from("entrada_pallets")
          .select("descricao")
          .eq("id", palletId)
          .single();

        if (positionData?.codigo !== positionCode) {
          throw new Error(`Código da posição incorreto. Esperado: ${positionData?.codigo}`);
        }

        if (palletData?.descricao !== palletCode) {
          throw new Error(`Código do pallet incorreto. Esperado: ${palletData?.descricao}`);
        }
      }

      // Alocar pallet na posição e criar estoque
      const { data, error } = await supabase.rpc("allocate_pallet_to_position", {
        p_pallet_id: palletId,
        p_posicao_id: positionId,
        p_observacoes: `Confirmado via ${method === "manual" ? "confirmação manual" : "scanner"}`
      });

      if (error) throw error;

      // Criar estoque do pallet
      const { error: stockError } = await supabase.rpc("create_stock_from_pallet", {
        p_pallet_id: palletId
      });

      if (stockError) throw stockError;

      return { success: true };
    },
    onSuccess: () => {
      if (shouldInvalidate) {
        queryClient.invalidateQueries({ queryKey: ["pallet-positions"] });
        queryClient.invalidateQueries({ queryKey: ["pallets-pendentes"] });
        queryClient.invalidateQueries({ queryKey: ["estoque"] });
        queryClient.invalidateQueries({ queryKey: ["storage-positions"] });
        // Invalidar notificações imediatamente após alocação
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
      toast({
        title: "Sucesso",
        description: "Pallet alocado e estoque criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};