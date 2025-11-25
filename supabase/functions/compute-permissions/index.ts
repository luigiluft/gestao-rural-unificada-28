import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ComputeResult {
  permissions: string[]
  is_subaccount: boolean
  role: string | null
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Verificar se já existe cache válido
    const { data: cached } = await supabaseAdmin
      .from('user_computed_permissions')
      .select('permissions, is_subaccount, role, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached) {
      console.log('🎯 Returning cached permissions for:', userId)
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Computing fresh permissions for:', userId)

    // Buscar role do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const role = profile.role

    // Verificar se é subconta
    const { data: hierarchyData } = await supabaseAdmin
      .from('user_hierarchy')
      .select('parent_user_id')
      .eq('child_user_id', userId)
      .maybeSingle()

    const isSubaccount = !!hierarchyData?.parent_user_id
    let permissions: string[] = []

    if (isSubaccount) {
      // É subconta - buscar permissões via template
      const { data: templateAssignment } = await supabaseAdmin
        .from('user_permission_templates')
        .select(`
          template_id,
          permission_templates(permissions)
        `)
        .eq('user_id', userId)
        .maybeSingle()

      if (templateAssignment?.permission_templates?.permissions) {
        permissions = templateAssignment.permission_templates.permissions as string[]
      }

      // Fallback para motoristas
      if (permissions.length === 0 && role === 'motorista') {
        permissions = ['proof-of-delivery.view', 'comprovantes.view']
      }
    } else {
      // É usuário master - buscar via page_permissions
      const { data: pagePermissions } = await supabaseAdmin
        .from('page_permissions')
        .select('page_key')
        .eq('role', role)
        .eq('can_access', true)

      permissions = pagePermissions?.map(p => `${p.page_key}.view`) || []
    }

    // Computar resultado
    const result: ComputeResult = {
      permissions,
      is_subaccount: isSubaccount,
      role
    }

    // Salvar no cache (10 minutos)
    await supabaseAdmin
      .from('user_computed_permissions')
      .upsert({
        user_id: userId,
        permissions,
        is_subaccount: isSubaccount,
        role,
        computed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })

    console.log('✅ Computed and cached permissions:', permissions.slice(0, 5))

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error computing permissions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})