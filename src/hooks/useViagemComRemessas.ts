import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ViagemData {
  numero: string;
  previsao_inicio: string;
  observacoes?: string;
  motorista_id?: string;
  veiculo_id?: string;
  placa_veiculo?: string;
  uf_veiculo?: string;
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

      // Get remessas details for statistics AND deposito_id
      const { data: remessas, error: remessasError } = await supabase
        .from('saidas')
        .select('valor_total, deposito_id')
        .in('id', remessasIds);

      if (remessasError) {
        console.error('❌ useViagemComRemessas: Error fetching remessas:', remessasError)
        throw remessasError;
      }

      if (!remessas || remessas.length === 0) {
        throw new Error('Nenhuma remessa encontrada');
      }

      // Use deposito_id from remessas - all remessas should be from the same deposito
      const depositoId = remessas[0].deposito_id;
      
      if (!depositoId) {
        throw new Error('Remessa sem depósito definido');
      }

      // Validate all remessas are from the same deposito
      const allSameDeposito = remessas.every(r => r.deposito_id === depositoId);
      if (!allSameDeposito) {
        throw new Error('Todas as remessas devem ser do mesmo depósito');
      }

      const valorTotal = remessas.reduce((acc, r) => acc + (r.valor_total || 0), 0);

      const viagemDataComplete = {
        numero: viagemData.numero,
        previsao_inicio: viagemData.previsao_inicio,
        data_inicio: null, // Será preenchido pelo motorista
        data_fim: null, // Será extraído da foto do comprovante
        observacoes: viagemData.observacoes || null,
        motorista_id: viagemData.motorista_id || null,
        veiculo_id: viagemData.veiculo_id || null,
        placa_veiculo: viagemData.placa_veiculo || null,
        uf_veiculo: viagemData.uf_veiculo || null,
        status: 'planejada',
        deposito_id: depositoId,
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

      // Update saidas to link them to the viagem with vehicle info
      const { error: updateError } = await supabase
        .from('saidas')
        .update({ 
          viagem_id: newViagem.id,
          placa_veiculo: viagemData.placa_veiculo || null,
          uf_veiculo: viagemData.uf_veiculo || null
        })
        .in('id', remessasIds);

      if (updateError) {
        console.error('❌ useViagemComRemessas: Error updating saidas:', updateError)
        throw updateError;
      }
      
      // Update entradas linked to these saidas with vehicle info
      const { error: entradasError } = await supabase
        .from('entradas')
        .update({ 
          viagem_id: newViagem.id,
          placa_veiculo: viagemData.placa_veiculo || null,
          uf_veiculo: viagemData.uf_veiculo || null
        })
        .in('saida_origem_id', remessasIds);

      if (entradasError) {
        console.error('⚠️ useViagemComRemessas: Error updating entradas:', entradasError)
      }
      
      console.log('✅ useViagemComRemessas: Viagem created and remessas allocated successfully:', newViagem)
      
      // Send notification to motorista if assigned
      if (newViagem.motorista_id) {
        try {
          const { data: motorista } = await supabase
            .from('motoristas')
            .select('auth_user_id, nome')
            .eq('id', newViagem.motorista_id)
            .maybeSingle();

          if (motorista?.auth_user_id) {
            await supabase.functions.invoke('manage-notifications', {
              body: {
                action: 'sendMotoristaNotification',
                data: {
                  motorista_user_id: motorista.auth_user_id,
                  title: 'Nova Viagem Atribuída',
                  message: `Viagem ${newViagem.numero} foi criada com ${remessasIds.length} remessa(s)`,
                  data: {
                    viagem_id: newViagem.id,
                    numero_viagem: newViagem.numero,
                    total_remessas: remessasIds.length
                  }
                }
              }
            });
            console.log('✅ Notification sent to motorista:', motorista.nome);
          }
        } catch (notificationError) {
          console.error('⚠️ Error sending notification:', notificationError);
          // Don't fail the whole operation if notification fails
        }
      }
      
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
      queryClient.invalidateQueries({ queryKey: ["viagens-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["motorista-notifications"] })
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