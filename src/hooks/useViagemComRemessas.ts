import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ViagemData {
  numero: string;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
  motorista_id?: string;
}

interface CreateViagemComRemessasParams {
  viagemData: ViagemData;
  remessasIds: string[];
}

export const useViagemComRemessas = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemData, remessasIds }: CreateViagemComRemessasParams) => {
      console.log('🔍 useViagemComRemessas: Creating viagem with remessas...', { viagemData, remessasIds })
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get user's franquia (deposito)
      const { data: franquia, error: franquiaError } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .maybeSingle();
        
      if (franquiaError) {
        console.error('❌ useViagemComRemessas: Error fetching franquia:', franquiaError)
        throw franquiaError;
      }
      
      if (!franquia) {
        // Fallback: get any active franquia for admin users
        const { data: fallbackFranquia } = await supabase
          .from('franquias')
          .select('id')
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();
          
        if (!fallbackFranquia) {
          throw new Error('Nenhuma franquia encontrada');
        }
      }

      // Get remessas details for statistics
      const { data: remessas, error: remessasError } = await supabase
        .from('saidas')
        .select('valor_total')
        .in('id', remessasIds);

      if (remessasError) {
        console.error('❌ useViagemComRemessas: Error fetching remessas:', remessasError)
        throw remessasError;
      }

      const valorTotal = remessas?.reduce((acc, r) => acc + (r.valor_total || 0), 0) || 0;

      const viagemDataComplete = {
        numero: viagemData.numero,
        data_inicio: viagemData.data_inicio,
        data_fim: viagemData.data_fim || null,
        observacoes: viagemData.observacoes || null,
        motorista_id: viagemData.motorista_id || null,
        status: 'planejada',
        deposito_id: franquia?.id || '',
        user_id: user.id,
        distancia_total: 0,
        distancia_percorrida: 0,
        total_remessas: remessasIds.length,
        remessas_entregues: 0,
      };
      
      console.log('🔍 useViagemComRemessas: Inserting viagem data:', viagemDataComplete)

      // Start a transaction to create viagem and allocate remessas
      const { data: newViagem, error: viagemError } = await supabase
        .from('viagens')
        .insert(viagemDataComplete)
        .select()
        .single();

      if (viagemError) {
        console.error('❌ useViagemComRemessas: Error inserting viagem:', viagemError)
        throw viagemError;
      }

      // Update saidas to link them to the viagem
      const { error: updateError } = await supabase
        .from('saidas')
        .update({ 
          viagem_id: newViagem.id
        })
        .in('id', remessasIds);

      if (updateError) {
        console.error('❌ useViagemComRemessas: Error updating saidas:', updateError)
        throw updateError;
      }
      
      console.log('✅ useViagemComRemessas: Viagem created and remessas allocated successfully:', newViagem)
      return newViagem;
    },
    onSuccess: () => {
      toast({
        title: "Viagem criada com sucesso",
        description: "A viagem foi criada e as remessas foram alocadas",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-com-remessas"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      queryClient.invalidateQueries({ queryKey: ["total-remessas-alocadas"] })
    },
    onError: (error) => {
      console.error("Erro ao criar viagem com remessas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a viagem",
        variant: "destructive",
      })
    },
  })
}