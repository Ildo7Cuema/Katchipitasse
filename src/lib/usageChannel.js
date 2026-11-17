import { isNativeApp, isStandaloneDisplay } from '@/lib/pwa'

export function detectUsageChannel() {
  if (typeof window === 'undefined') return 'unknown'
  if (isNativeApp()) return 'native'
  if (isStandaloneDisplay()) return 'pwa'
  return 'web'
}

export function getOrCreateGuestKey() {
  const key = 'ke_guest_key'
  try {
    let value = localStorage.getItem(key)
    if (!value) {
      value = `g_${crypto.randomUUID()}`
      localStorage.setItem(key, value)
    }
    return value
  } catch {
    return null
  }
}

export function channelLabel(channel) {
  switch (channel) {
    case 'pwa':
      return 'App instalada (PWA)'
    case 'native':
      return 'App nativa'
    case 'web':
      return 'Browser (web)'
    default:
      return 'Desconhecido'
  }
}

export function eventTypeLabel(type) {
  switch (type) {
    case 'session_start':
      return 'Início de sessão'
    case 'page_view':
      return 'Página vista'
    case 'login':
      return 'Login'
    case 'order':
      return 'Pedido'
    case 'reservation':
      return 'Reserva'
    default:
      return type
  }
}
