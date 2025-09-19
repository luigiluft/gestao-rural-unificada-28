import { supabase } from "@/integrations/supabase/client"

export const transferirSaidaEntregueParaRemessa = async () => {
  try {
    // Get the delivered saida that's not in any remessa
    const { data: saidaEntregue, error: saidaError } = await supabase
      .from("saidas")
      .select("id, user_id, deposito_id")
      .eq("status", "entregue")
      .is("remessa_id", null)
      .maybeSingle()

    if (saidaError || !saidaEntregue) {
      console.log("Nenhuma saída entregue para transferir")
      return null
    }

    // Create remessa for the delivered saida
    const { data: remessa, error: remessaError } = await supabase
      .from("remessas")
      .insert({
        numero: `REM-ENTREGUE-${Date.now().toString().slice(-6)}`,
        user_id: saidaEntregue.user_id,
        deposito_id: saidaEntregue.deposito_id,
        status: 'entregue',
        total_saidas: 1
      })
      .select()
      .single()

    if (remessaError) throw remessaError

    // Update saida to reference the remessa
    const { error: updateError } = await supabase
      .from("saidas")
      .update({ remessa_id: remessa.id })
      .eq("id", saidaEntregue.id)

    if (updateError) throw updateError

    console.log("Saída transferida para remessa:", remessa.numero)
    return remessa
  } catch (error) {
    console.error("Erro ao transferir saída:", error)
    throw error
  }
}