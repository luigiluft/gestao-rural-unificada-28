import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { action, data } = await req.json()

    let result
    switch (action) {
      case 'create_notification':
        result = await createNotification(supabaseClient, user.id, data)
        break
      case 'mark_as_read':
        result = await markAsRead(supabaseClient, user.id, data.id)
        break
      case 'mark_all_read':
        result = await markAllAsRead(supabaseClient, user.id)
        break
      case 'delete_notification':
        result = await deleteNotification(supabaseClient, user.id, data.id)
        break
      case 'bulk_create':
        result = await bulkCreateNotifications(supabaseClient, user.id, data)
        break
      case 'send_viagem_notification':
        result = await sendViagemNotification(supabaseClient, user.id, data)
        break
      case 'send_motorista_notification':
        result = await sendMotoristaNotification(supabaseClient, user.id, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in manage-notifications:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createNotification(supabase: any, userId: string, data: any) {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      ...data,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return notification
}

async function markAsRead(supabase: any, userId: string, notificationId: string) {
  const { data: notification, error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return notification
}

async function markAllAsRead(supabase: any, userId: string) {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('read', false)
    .select()

  if (error) throw error
  return notifications
}

async function deleteNotification(supabase: any, userId: string, notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
  return { id: notificationId }
}

async function bulkCreateNotifications(supabase: any, userId: string, data: any) {
  const { notifications } = data
  
  const notificationsWithTimestamps = notifications.map((notif: any) => ({
    ...notif,
    created_at: new Date().toISOString()
  }))

  const { data: createdNotifications, error } = await supabase
    .from('notifications')
    .insert(notificationsWithTimestamps)
    .select()

  if (error) throw error
  return createdNotifications
}

async function sendViagemNotification(supabase: any, userId: string, data: any) {
  const { viagemId, motoristaId, message, type } = data
  
  // Create notification for motorista
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: motoristaId,
      title: 'Nova Viagem Atribuída',
      message: message || 'Você foi designado para uma nova viagem',
      type: type || 'viagem_assignment',
      data: { viagemId },
      read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return notification
}

async function sendMotoristaNotification(supabase: any, userId: string, data: any) {
  const { motoristaId, title, message, type, extraData } = data
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: motoristaId,
      title,
      message,
      type: type || 'general',
      data: extraData || {},
      read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return notification
}