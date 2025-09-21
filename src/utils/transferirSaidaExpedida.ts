import { supabase } from "@/integrations/supabase/client"

export const transferirSaidaExpedidaParaRemessa = async () => {
  try {
    // Get the expedited saida that's not in any remessa
    const { data: saidaExpedida, error: saidaError } = await supabase
      .from("saidas")
      .select("id, user_id, deposito_id")
      .eq("status", "expedido")
      .is("remessa_id", null)
      .maybeSingle()

    if (saidaError || !saidaExpedida) {
      console.log("Nenhuma saída expedida para transferir")
      return null
    }

    // Create remessa for the expedited saida with 'pronta' status for planning
    const { data: remessa, error: remessaError } = await supabase
      .from("remessas")
      .insert({
        numero: `REM-${Date.now().toString().slice(-6)}`,
        user_id: saidaExpedida.user_id,
        deposito_id: saidaExpedida.deposito_id,
        status: 'pronta',
        total_saidas: 1
      })
      .select()
      .single()

    if (remessaError) throw remessaError

    // Update saida to reference the remessa
    const { error: updateError } = await supabase
      .from("saidas")
      .update({ remessa_id: remessa.id })
      .eq("id", saidaExpedida.id)

    if (updateError) throw updateError

    console.log("Saída expedida transferida para remessa:", remessa.numero)
    return remessa
  } catch (error) {
    console.error("Erro ao transferir saída:", error)
    throw error
  }
}