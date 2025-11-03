import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Iniciando fechamento automático de faturas...')

    const hoje = new Date().toISOString().split('T')[0]

    // Get draft invoices with due date <= today
    const { data: faturas, error: faturasError } = await supabase
      .from('faturas')
      .select('id, numero_fatura, data_vencimento, contrato_id')
      .eq('status', 'rascunho')
      .lte('data_vencimento', hoje)

    if (faturasError) {
      throw faturasError
    }

    console.log(`Encontradas ${faturas?.length || 0} faturas para fechar`)

    const resultados = {
      total: faturas?.length || 0,
      fechadas: 0,
      erros: [] as any[]
    }

    // Close each invoice
    for (const fatura of faturas || []) {
      try {
        console.log(`Fechando fatura ${fatura.numero_fatura}...`)

        // Call fechar-fatura function
        const { data, error } = await supabase.functions.invoke('fechar-fatura', {
          body: { fatura_id: fatura.id }
        })

        if (error) {
          throw error
        }

        resultados.fechadas++
        console.log(`Fatura ${fatura.numero_fatura} fechada com sucesso`)
      } catch (error: any) {
        console.error(`Erro ao fechar fatura ${fatura.numero_fatura}:`, error)
        resultados.erros.push({
          fatura_id: fatura.id,
          numero_fatura: fatura.numero_fatura,
          erro: error.message
        })
      }
    }

    console.log('Fechamento automático concluído:', resultados)

    return new Response(
      JSON.stringify({ 
        message: 'Processo de fechamento automático concluído',
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro no fechamento automático de faturas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
