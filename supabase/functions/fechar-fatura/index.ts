import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Obter o usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fatura_id } = await req.json();

    if (!fatura_id) {
      return new Response(
        JSON.stringify({ error: 'fatura_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fechando fatura:', fatura_id);

    // Buscar a fatura e validar permissões
    const { data: fatura, error: faturaError } = await supabaseClient
      .from('faturas')
      .select(`
        *,
        contratos_servico!inner(
          franquia_id
        )
      `)
      .eq('id', fatura_id)
      .single();

    if (faturaError || !fatura) {
      console.error('Error fetching fatura:', faturaError);
      return new Response(
        JSON.stringify({ error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário é franqueado ou admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    
    // Verificar se o usuário é o franqueado dono da franquia
    const { data: franquia } = await supabaseClient
      .from('franquias')
      .select('master_franqueado_id')
      .eq('id', fatura.contratos_servico.franquia_id)
      .single();

    const isFranqueado = franquia?.master_franqueado_id === user.id;

    if (!isAdmin && !isFranqueado) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para fechar esta fatura' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a fatura já está fechada
    if (fatura.status !== 'rascunho') {
      return new Response(
        JSON.stringify({ error: 'Fatura já está fechada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fechar a fatura: mudar status de 'rascunho' para 'pendente'
    const { data: faturaFechada, error: updateError } = await supabaseClient
      .from('faturas')
      .update({
        status: 'pendente',
        data_fechamento: new Date().toISOString(),
        fechada_por: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', fatura_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error closing fatura:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao fechar fatura' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fatura fechada com sucesso:', faturaFechada);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fatura: faturaFechada,
        message: 'Fatura fechada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fechar-fatura function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
