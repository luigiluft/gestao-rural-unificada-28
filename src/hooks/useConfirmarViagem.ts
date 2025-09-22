import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useConfirmarViagem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ viagemId }: { viagemId: string }) => {
      // Update viagem status to 'em_andamento'
      const { error: viagemError } = await supabase
        .from("viagens")
        .update({ 
          status: "em_andamento"
        })
        .eq("id", viagemId)

      if (viagemError) throw viagemError

      // Get all saidas for this viagem to create agendamentos
      const { data: saidas, error: saidasError } = await supabase
        .from("saidas")
        .select(`
          id,
          data_saida,
          observacoes,
          user_id,
          deposito_id,
          saida_itens (
            produto_id,
            produtos (
              nome
            )
          )
        `)
        .eq("viagem_id", viagemId)

      if (saidasError) throw saidasError

      // Create agendamentos for each saida
      const agendamentosToCreate = saidas?.map(saida => {
        // Get product descriptions
        const produtos = saida.saida_itens?.map(item => 
          item.produtos?.nome
        ).filter(Boolean).join(", ") || "Produtos diversos"

        // Check if there's a reserved time for this saida
        const horarioDefault = "08:00"

        return {
          user_id: saida.user_id,
          tipo: "entrega",
          numero: `SAIDA-${saida.id.slice(0, 8)}`,
          cliente_nome: "Cliente da saída",
          cliente_telefone: null,
          cliente_email: null,
          endereco: "Endereço da entrega",
          data_agendamento: saida.data_saida,
          horario_agendamento: horarioDefault,
          status: "confirmado",
          prioridade: "media",
          produto_descricao: produtos,
          observacoes: `Entrega da viagem. ${saida.observacoes || ""}`.trim()
        }
      }) || []

      if (agendamentosToCreate.length > 0) {
        const { error: agendamentosError } = await supabase
          .from("agendamentos")
          .insert(agendamentosToCreate)

        if (agendamentosError) {
          console.error("Erro ao criar agendamentos:", agendamentosError)
          // Don't throw here - viagem was confirmed successfully
        }
      }

      return { viagemId, agendamentosCriados: agendamentosToCreate.length }
    },
    onSuccess: (data) => {
      toast({
        title: "Viagem confirmada",
        description: `A viagem foi confirmada e ${data.agendamentosCriados} agendamentos foram criados`,
      })
      queryClient.invalidateQueries({ queryKey: ["viagens"] })
      queryClient.invalidateQueries({ queryKey: ["viagens-com-remessas"] })
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] })
    },
    onError: (error) => {
      console.error("Erro ao confirmar viagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a viagem",
        variant: "destructive",
      })
    },
  })
}