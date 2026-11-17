import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { detectUsageChannel, getOrCreateGuestKey } from '@/lib/usageChannel'
import { logUsageEvent, touchLastSeen } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

const SESSION_KEY = 'ke_usage_session_at'

/**
 * Regista sessões e páginas vistas para o Super Admin monitorizar uso.
 */
export default function UsageTracker() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const lastPath = useRef('')
  const channel = detectUsageChannel()

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return undefined

    let cancelled = false
    ;(async () => {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        const last = raw ? Number(raw) : 0
        const stale = !last || Date.now() - last > 30 * 60 * 1000
        if (!stale || cancelled) return
        sessionStorage.setItem(SESSION_KEY, String(Date.now()))
        await logUsageEvent({
          userId: user?.id || null,
          guestKey: getOrCreateGuestKey(),
          role: profile?.role || null,
          eventType: 'session_start',
          path: location.pathname,
          channel,
          meta: { viewport: `${window.innerWidth}x${window.innerHeight}` },
        })
      } catch {
        /* ignore */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, user?.id, profile?.role, channel, location.pathname])

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return undefined
    const path = location.pathname + (location.search || '')
    if (path === lastPath.current) return undefined
    lastPath.current = path

    const timer = window.setTimeout(() => {
      void logUsageEvent({
        userId: user?.id || null,
        guestKey: getOrCreateGuestKey(),
        role: profile?.role || null,
        eventType: 'page_view',
        path,
        channel,
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search, loading, user?.id, profile?.role, channel])

  // Heartbeat de presença (só last_seen, sem inflacionar page_views)
  useEffect(() => {
    if (loading || !user?.id || !isSupabaseConfigured) return undefined
    void touchLastSeen()
    const id = window.setInterval(() => {
      void touchLastSeen()
    }, 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [loading, user?.id])

  return null
}
