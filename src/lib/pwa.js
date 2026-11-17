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

export function isIosSafari() {
  const ua = navigator.userAgent || ''
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/i.test(ua)
  const chrome = /CriOS|Chrome|EdgiOS|FxiOS/i.test(ua)
  return iOS && webkit && !chrome
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

export function shouldForceInstall() {
  if (isNativeApp()) return false
  if (isStandaloneDisplay()) return false
  if (wasInstallUnlocked()) return false
  if (!isMobileDevice()) return false
  return true
}
