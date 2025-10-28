import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useAlocarSaidaViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      viagemId, 
      saidaId 
    }: { 
      viagemId: string
      saidaId: string 
    }) => {
      // Update saida to link to viagem
      const { error } = await supabase
        .from("saidas")
        .update({ 
          viagem_id: viagemId
        })
        .eq("id", saidaId)

      if (error) throw error
      return { viagemId, saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Saída alocada",
        description: "A saída foi alocada à viagem com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-com-remessas"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      queryClient.invalidateQueries({ queryKey: ["total-remessas-alocadas"] })
    },
    onError: (error) => {
      console.error("Erro ao alocar saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível alocar a saída à viagem",
        variant: "destructive",
      })
    },
  })
}

export const useDesalocarSaidaViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ saidaId }: { saidaId: string }) => {
      // Remove viagem link and change status back to expedido
      const { error } = await supabase
        .from("saidas")
        .update({ 
          viagem_id: null,
          status: "expedido" 
        })
        .eq("id", saidaId)

      if (error) throw error
      return { saidaId }
    },
    onSuccess: () => {
      toast({
        title: "Saída desalocada",
        description: "A saída foi removida da viagem com sucesso",
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-com-remessas"] })
      queryClient.invalidateQueries({ queryKey: ["remessas"] })
      queryClient.invalidateQueries({ queryKey: ["total-remessas-alocadas"] })
    },
    onError: (error) => {
      console.error("Erro ao desalocar saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover a saída da viagem",
        variant: "destructive",
      })
    },
  })
}

export const useViagemSaidasDetails = (viagemId: string | undefined) => {
  return useQuery({
    queryKey: ["viagem-saidas-details", viagemId],
    queryFn: async () => {
      if (!viagemId) return []
      
      const { data, error } = await supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          frete_destino,
          tipo_saida,
          fazenda_id,
          fazenda:fazenda_id (
            id,
            nome,
            tipo_logradouro,
            nome_logradouro,
            numero,
            complemento,
            bairro,
            municipio,
            uf,
            cep
          ),
          saida_itens (
            id,
            quantidade,
            lote,
            produto_id,
            produtos (
              nome,
              codigo
            )
          )
        `)
        .eq("viagem_id", viagemId)
      
      if (error) throw error
      return data || []
    },
    enabled: !!viagemId
  })
}