import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isStandaloneDisplay, wasInstallUnlocked } from '@/lib/pwa'
import { ensurePushSubscription } from '@/lib/webPush'

/**
 * Regista Web Push quando o utilizador está autenticado e a app está instalada/desbloqueada.
 */
export default function PushBootstrap() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user?.id) return undefined
    if (!isStandaloneDisplay() && !wasInstallUnlocked()) return undefined

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) void ensurePushSubscription(user.id)
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [user?.id, loading])

  return null
}
