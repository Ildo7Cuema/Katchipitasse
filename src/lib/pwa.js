const INSTALL_UNLOCK_KEY = 'ke_pwa_install_unlocked'

export function isNativeApp() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia?.('(display-mode: standalone)')?.matches
  const iosStandalone = window.navigator.standalone === true
  return Boolean(mq || iosStandalone)
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches
  const narrow = window.matchMedia?.('(max-width: 900px)')?.matches
  return mobileUa || (Boolean(coarse) && Boolean(narrow))
}

/** Qualquer iPhone/iPad (Safari, Chrome, etc.) — nenhum tem beforeinstallprompt. */
export function isIosDevice() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isIosSafari() {
  if (!isIosDevice()) return false
  const ua = navigator.userAgent || ''
  const webkit = /WebKit/i.test(ua)
  const other = /CriOS|Chrome|EdgiOS|FxiOS|OPiOS|OPT\//i.test(ua)
  return webkit && !other
}

export function isAndroidDevice() {
  if (typeof window === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

export function wasInstallUnlocked() {
  try {
    return localStorage.getItem(INSTALL_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export function markInstallUnlocked() {
  try {
    localStorage.setItem(INSTALL_UNLOCK_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearInstallUnlocked() {
  try {
    localStorage.removeItem(INSTALL_UNLOCK_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Bloqueia telemóvel no browser até a app estar em modo standalone (ícone).
 * O flag localStorage só dá uma graça curta após confirmação nativa Android,
 * para o utilizador fechar o separador e abrir pelo ícone.
 */
export function shouldForceInstall() {
  if (isNativeApp()) return false
  if (isStandaloneDisplay()) return false
  if (!isMobileDevice()) return false
  return true
}
