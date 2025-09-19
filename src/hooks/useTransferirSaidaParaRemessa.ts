import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useTransferirSaidaParaRemessa = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      saidaIds, 
      numeroRemessa 
    }: { 
      saidaIds: string[]
      numeroRemessa?: string 
    }) => {
      // Generate remessa number if not provided
      const numero = numeroRemessa || `REM-${Date.now().toString().slice(-8)}`
      
      // Create remessa
      const { data: remessa, error: remessaError } = await supabase
        .from("remessas")
        .insert({
          numero,
          status: 'criada',
          data_criacao: new Date().toISOString(),
          total_saidas: saidaIds.length
        })
        .select()
        .single()

      if (remessaError) throw remessaError

      // Update saidas to reference the remessa and change status
      const { error: saidasError } = await supabase
        .from("saidas")
        .update({
          remessa_id: remessa.id,
          status: 'em_remessa'
        })
        .in("id", saidaIds)

      if (saidasError) throw saidasError

      return { remessa, saidaIds }
    },
    onSuccess: (data) => {
      toast({
        title: "Remessa criada",
        description: `${data.saidaIds.length} saídas transferidas para a remessa ${data.remessa.numero}`,
      })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      queryClient.invalidateQueries({ queryKey: ["saidas-pendentes"] })
      queryClient.invalidateQueries({ queryKey: ["saidas"] })
    },
    onError: (error) => {
      console.error("Erro ao transferir saídas para remessa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível transferir as saídas para a remessa",
        variant: "destructive",
      })
    },
  })
}