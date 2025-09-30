import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useProducerEntradas = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["producer-entradas", dateRange],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      // Get producer's CPF/CNPJ
      const { data: profile } = await supabase
        .from("profiles")
        .select("cpf_cnpj")
        .eq("user_id", user.user.id)
        .single()

      if (!profile?.cpf_cnpj) {
        console.warn("Producer doesn't have CPF/CNPJ registered")
      }

      // Clean CPF/CNPJ for comparison (remove all non-digit characters)
      const cpfCnpjLimpo = profile?.cpf_cnpj?.replace(/\D/g, '') || ''
      
      console.log('🔍 [DEBUG] Producer CPF/CNPJ:', {
        original: profile?.cpf_cnpj,
        cleaned: cpfCnpjLimpo,
        userId: user.user.id
      })

      let query = supabase
        .from("entradas")
        .select(`
          *,
          fornecedores(nome),
          entrada_itens(
            *,
            produtos(nome, unidade_medida)
          )
        `)

      // Apply date filters if provided
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte("created_at", endDate.toISOString())
      }

      const { data: allEntradas, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      console.log('📦 [DEBUG] Total entradas from database:', allEntradas?.length)
      console.log('📦 [DEBUG] All entradas:', allEntradas?.map(e => ({
        numero_nfe: e.numero_nfe,
        user_id: e.user_id,
        emitente_cnpj: e.emitente_cnpj,
        destinatario_cpf_cnpj: e.destinatario_cpf_cnpj,
        created_at: e.created_at
      })))

      // Filter entradas by producer's CPF/CNPJ (comparing cleaned versions)
      const entradas = (allEntradas || []).filter(entrada => {
        console.log(`\n🔎 [DEBUG] Checking entrada NF-${entrada.numero_nfe}:`, {
          user_id: entrada.user_id,
          matches_user: entrada.user_id === user.user.id,
          emitente_cnpj_original: entrada.emitente_cnpj,
          destinatario_cpf_cnpj_original: entrada.destinatario_cpf_cnpj
        })
        // Always include entradas created by the user
        if (entrada.user_id === user.user.id) {
          console.log(`✅ [DEBUG] NF-${entrada.numero_nfe}: Included (created by user)`)
          return true
        }
        
        // If no CPF/CNPJ, only show user's own entradas
        if (!cpfCnpjLimpo) {
          console.log(`❌ [DEBUG] NF-${entrada.numero_nfe}: Excluded (no producer CPF/CNPJ)`)
          return false
        }
        
        // Clean the entrada's CPF/CNPJ fields for comparison
        const emitenteCnpjLimpo = entrada.emitente_cnpj?.replace(/\D/g, '') || ''
        const destinatarioCpfCnpjLimpo = entrada.destinatario_cpf_cnpj?.replace(/\D/g, '') || ''
        
        console.log(`🔍 [DEBUG] NF-${entrada.numero_nfe}: Comparing CPF/CNPJ:`, {
          producer_cpf_cnpj: cpfCnpjLimpo,
          emitente_cnpj_cleaned: emitenteCnpjLimpo,
          destinatario_cpf_cnpj_cleaned: destinatarioCpfCnpjLimpo,
          matches_emitente: emitenteCnpjLimpo === cpfCnpjLimpo,
          matches_destinatario: destinatarioCpfCnpjLimpo === cpfCnpjLimpo
        })
        
        // Check if producer's CPF/CNPJ matches emitente or destinatario (cleaned comparison)
        const matches = emitenteCnpjLimpo === cpfCnpjLimpo || destinatarioCpfCnpjLimpo === cpfCnpjLimpo
        
        if (matches) {
          console.log(`✅ [DEBUG] NF-${entrada.numero_nfe}: Included (CPF/CNPJ match)`)
        } else {
          console.log(`❌ [DEBUG] NF-${entrada.numero_nfe}: Excluded (no CPF/CNPJ match)`)
        }
        
        return matches
      })
      
      console.log('📊 [DEBUG] Final filtered entradas count:', entradas.length)
      console.log('📊 [DEBUG] Filtered entradas NFs:', entradas.map(e => e.numero_nfe))

      // Get franquia names for each entrada
      const entradasWithFranquias = await Promise.all(
        (entradas || []).map(async (entrada) => {
          if (entrada.deposito_id) {
            const { data: franquia } = await supabase
              .from("franquias")
              .select("nome")
              .eq("id", entrada.deposito_id)
              .single()
            
            return {
              ...entrada,
              franquia_nome: franquia?.nome
            }
          }
          return entrada
        })
      )

      return entradasWithFranquias || []
    },
  })
}