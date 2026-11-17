import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAppLockStatus } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

const PlatformAccessContext = createContext(null)

const openStatus = {
  is_blocked: false,
  block_reason: null,
  status: null,
  ends_at: null,
  plan_name: null,
  billing_cycle: 'annual',
}

export function PlatformAccessProvider({ children }) {
  const [lockStatus, setLockStatus] = useState(openStatus)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLockStatus(openStatus)
      return openStatus
    }
    try {
      const data = await getAppLockStatus()
      const next = {
        is_blocked: Boolean(data?.is_blocked),
        block_reason: data?.block_reason || null,
        status: data?.status || null,
        ends_at: data?.ends_at || null,
        plan_name: data?.plan_name || null,
        billing_cycle: data?.billing_cycle || 'annual',
      }
      setLockStatus(next)
      return next
    } catch {
      // Se a migration 004 ainda não correu, não bloquear a app
      setLockStatus(openStatus)
      return openStatus
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refresh()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      lockStatus,
      isAppBlocked: lockStatus.is_blocked,
      blockReason: lockStatus.block_reason,
      loading,
      refresh,
    }),
    [lockStatus, loading, refresh],
  )

  return <PlatformAccessContext.Provider value={value}>{children}</PlatformAccessContext.Provider>
}

export function usePlatformAccess() {
  const ctx = useContext(PlatformAccessContext)
  if (!ctx) throw new Error('usePlatformAccess deve ser usado dentro de PlatformAccessProvider')
  return ctx
}
