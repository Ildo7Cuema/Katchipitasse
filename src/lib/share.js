import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export async function shareContent({ title, text, url }) {
  const payload = {
    title: title || 'Katchiitassi Elavoko',
    text: text || '',
    url: url || APP_URL,
    dialogTitle: 'Partilhar',
  }

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share(payload)
      return { ok: true }
    }

    if (navigator.share) {
      await navigator.share(payload)
      return { ok: true }
    }

    const clipboard = `${payload.title}\n${payload.text}\n${payload.url}`.trim()
    await navigator.clipboard.writeText(clipboard)
    return { ok: true, fallback: 'clipboard' }
  } catch (error) {
    if (error?.name === 'AbortError') return { ok: false, aborted: true }
    return { ok: false, error }
  }
}

export function buildShareUrl(path = '/') {
  return `${APP_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
