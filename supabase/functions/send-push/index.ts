// Supabase Edge Function — envia Web Push aos admins (app pode estar fechada)
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...), SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('VITE_VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:contacto@katchipitasse.ao'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: 'VAPID keys em falta' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    webpush.setVapidDetails(subject, vapidPublic, vapidPrivate)

    const body = await req.json()
    const title = body.title || 'Katchipitasse Elavoko'
    const message = body.body || 'Nova notificação'
    const url = body.url || '/'
    const audience = body.audience || 'store_admins'

    const admin = createClient(supabaseUrl, serviceKey)

    let rows: { endpoint: string; p256dh: string; auth: string }[] = []
    if (audience === 'store_admins') {
      const { data, error } = await admin.rpc('list_store_admin_push_subscriptions')
      if (error) throw error
      rows = data || []
    } else if (body.user_id) {
      const { data, error } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', body.user_id)
      if (error) throw error
      rows = data || []
    }

    const payload = JSON.stringify({ title, body: message, url, tag: body.tag || 'ke-push' })
    let sent = 0
    const stale: string[] = []

    await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            payload,
          )
          sent += 1
        } catch (err) {
          const status = err?.statusCode || err?.status
          if (status === 404 || status === 410) stale.push(row.endpoint)
        }
      }),
    )

    if (stale.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', stale)
    }

    return new Response(JSON.stringify({ ok: true, sent, total: rows.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
