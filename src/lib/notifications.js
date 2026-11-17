const STORAGE_PREFIX = 'ke_admin_notifications_'
const ACK_PREFIX = 'ke_admin_notif_ack_'

export function loadStoredNotifications(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredNotifications(userId, items) {
  if (!userId) return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(items.slice(0, 50)))
  } catch {
    /* ignore quota */
  }
}

export function loadAcknowledgedIds(userId) {
  if (!userId) return new Set()
  try {
    const raw = localStorage.getItem(`${ACK_PREFIX}${userId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function saveAcknowledgedIds(userId, ids) {
  if (!userId) return
  try {
    localStorage.setItem(`${ACK_PREFIX}${userId}`, JSON.stringify([...ids].slice(-200)))
  } catch {
    /* ignore quota */
  }
}

export function buildOrderNotification(row) {
  return {
    id: `order-${row.id}`,
    type: 'order',
    title: 'Novo pedido',
    body: `${row.customer_name || 'Cliente'} · ${row.customer_phone || 'sem telefone'}`,
    href: '/admin/pedidos',
    entityId: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    read: false,
  }
}

export function buildReservationNotification(row) {
  return {
    id: `reservation-${row.id}`,
    type: 'reservation',
    title: 'Nova reserva',
    body: `${row.customer_name || 'Cliente'} · ${row.guests || 1} hóspede(s)`,
    href: '/admin/reservas',
    entityId: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    read: false,
  }
}

export async function ensureBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification({ title, body, href }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: href,
    })
    n.onclick = () => {
      window.focus()
      if (href) window.location.assign(href)
      n.close()
    }
  } catch {
    /* ignore */
  }
}
