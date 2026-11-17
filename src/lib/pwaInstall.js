/** Captura early do beforeinstallprompt (antes do React montar). */

let deferredPrompt = null
const listeners = new Set()

export function initInstallPromptCapture() {
  if (typeof window === 'undefined') return
  if (window.__keInstallCaptureInit) return
  window.__keInstallCaptureInit = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    listeners.forEach((fn) => {
      try {
        fn(event)
      } catch {
        /* ignore */
      }
    })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => {
      try {
        fn(null)
      } catch {
        /* ignore */
      }
    })
  })
}

export function getDeferredInstallPrompt() {
  return deferredPrompt
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null
}

export function subscribeInstallPrompt(listener) {
  listeners.add(listener)
  if (deferredPrompt) listener(deferredPrompt)
  return () => listeners.delete(listener)
}

export async function promptInstall() {
  const promptEvent = deferredPrompt
  if (!promptEvent) {
    return { ok: false, reason: 'unavailable' }
  }
  try {
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    deferredPrompt = null
    return { ok: choice?.outcome === 'accepted', reason: choice?.outcome || 'unknown' }
  } catch (err) {
    return { ok: false, reason: 'error', error: err }
  }
}
