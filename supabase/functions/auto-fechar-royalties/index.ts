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

    console.log('Iniciando fechamento automático de royalties...')

    const hoje = new Date().toISOString().split('T')[0]

    // Buscar royalties em rascunho com data de vencimento <= hoje
    const { data: royalties, error: royaltiesError } = await supabase
      .from('royalties')
      .select('id, numero_royalty, data_vencimento, contrato_franquia_id')
      .eq('status', 'rascunho')
      .lte('data_vencimento', hoje)

    if (royaltiesError) {
      throw royaltiesError
    }

    console.log(`Encontrados ${royalties?.length || 0} royalties para fechar`)

    const resultados = {
      total: royalties?.length || 0,
      fechados: 0,
      erros: [] as any[]
    }

    // Fechar cada royalty
    for (const royalty of royalties || []) {
      try {
        console.log(`Fechando royalty ${royalty.numero_royalty}...`)

        // Chamar função fechar-royalty
        const { data, error } = await supabase.functions.invoke('fechar-royalty', {
          body: { royalty_id: royalty.id }
        })

        if (error) {
          throw error
        }

        resultados.fechados++
        console.log(`Royalty ${royalty.numero_royalty} fechado com sucesso`)
      } catch (error: any) {
        console.error(`Erro ao fechar royalty ${royalty.numero_royalty}:`, error)
        resultados.erros.push({
          royalty_id: royalty.id,
          numero_royalty: royalty.numero_royalty,
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
    console.error('Erro no fechamento automático de royalties:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
