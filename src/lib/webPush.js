import { isNativeApp } from '@/lib/pwa'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export function canUseWebPush() {
  return (
    typeof window !== 'undefined' &&
    !isNativeApp() &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function ensurePushSubscription(userId) {
  if (!canUseWebPush() || !isSupabaseConfigured || !supabase || !userId) return null

  const vapidPublic = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublic) {
    console.warn('VITE_VAPID_PUBLIC_KEY em falta — push desactivado')
    return null
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh || '',
      auth: json.keys?.auth || '',
      user_agent: navigator.userAgent.slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  if (error) {
    console.warn('Falha ao guardar push subscription', error)
    return null
  }
  return subscription
}

/** Pede ao backend para enviar push aos admins (app pode estar fechada). */
export async function requestAdminPush({ title, body, url = '/admin/pedidos' }) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.functions.invoke('send-push', {
      body: {
        audience: 'store_admins',
        title,
        body,
        url,
      },
    })
  } catch (err) {
    console.warn('send-push invoke failed', err)
  }
}
