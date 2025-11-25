import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDepositoFilter } from "./useDepositoFilter"

export const useProducerEntradas = (dateRange?: { from?: Date; to?: Date }) => {
  const { depositoId, shouldFilter } = useDepositoFilter()
  
  return useQuery({
    queryKey: ["producer-entradas", dateRange, depositoId],
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

      console.log('🔍 [useProducerEntradas] CPF/CNPJ do produtor:', cpfCnpjLimpo)

      let query = supabase
        .from("entradas")
        .select(`
          *,
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

      // Apply deposit filter if needed
      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId)
      }

      const { data: allEntradas, error } = await query.order("created_at", { ascending: false })

      console.log('📦 [useProducerEntradas] Query result:', {
        count: allEntradas?.length || 0,
        error: error?.message,
        firstEntry: allEntradas?.[0]
      })

      if (error) {
        console.error('❌ [useProducerEntradas] Query error:', error)
        throw error
      }

      // Filter entradas by producer's CPF/CNPJ - RLS handles this now, so we just return all
      const entradas = allEntradas || []

      if (!cpfCnpjLimpo) {
        console.warn('⚠️ [useProducerEntradas] Produtor sem CPF/CNPJ cadastrado. Não é possível filtrar entradas.')
      }

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

      console.log('✅ [useProducerEntradas] Final result:', {
        totalEntradas: entradasWithFranquias?.length || 0,
        depositoIds: [...new Set(entradasWithFranquias?.map(e => e.deposito_id))],
        franquiasEncontradas: entradasWithFranquias?.filter(e => 'franquia_nome' in e && e.franquia_nome).length
      })

      return entradasWithFranquias || []
    },
  })
}