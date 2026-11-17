import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  buildOrderNotification,
  buildReservationNotification,
  ensureBrowserNotificationPermission,
  loadAcknowledgedIds,
  loadStoredNotifications,
  saveAcknowledgedIds,
  saveStoredNotifications,
  showBrowserNotification,
} from '@/lib/notifications'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  getRecentOrdersForNotifications,
  getRecentReservationsForNotifications,
} from '@/services/api'

const NotificationContext = createContext(null)
const POLL_MS = 12_000

export function NotificationProvider({ children }) {
  const { user, isStoreAdmin, loading: authLoading } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  )
  const knownIds = useRef(new Set())
  const acknowledgedIds = useRef(new Set())
  const ready = useRef(false)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!user?.id || !isStoreAdmin) {
      setItems([])
      knownIds.current = new Set()
      acknowledgedIds.current = new Set()
      ready.current = false
      bootstrapped.current = false
      return
    }
    const stored = loadStoredNotifications(user.id)
    setItems(stored)
    knownIds.current = new Set(stored.map((n) => n.id))
    acknowledgedIds.current = loadAcknowledgedIds(user.id)
    for (const n of stored) acknowledgedIds.current.add(n.id)
    ready.current = true
    bootstrapped.current = false
  }, [user?.id, isStoreAdmin])

  useEffect(() => {
    if (!user?.id || !isStoreAdmin) return
    saveStoredNotifications(user.id, items)
  }, [items, user?.id, isStoreAdmin])

  const persistAck = useCallback(() => {
    if (!user?.id) return
    saveAcknowledgedIds(user.id, acknowledgedIds.current)
  }, [user?.id])

  const pushNotification = useCallback(
    (notification, { silent = false } = {}) => {
      if (!notification?.id) return
      if (knownIds.current.has(notification.id) || acknowledgedIds.current.has(notification.id)) return
      knownIds.current.add(notification.id)
      acknowledgedIds.current.add(notification.id)
      persistAck()
      setItems((prev) => [notification, ...prev].slice(0, 50))
      if (!silent) {
        toast.info(`${notification.title}: ${notification.body}`)
        showBrowserNotification(notification)
      }
    },
    [persistAck, toast],
  )

  const syncFromServer = useCallback(
    async ({ alertNew = true } = {}) => {
      if (!isStoreAdmin || !isSupabaseConfigured || !ready.current) return
      try {
        const [orders, reservations] = await Promise.all([
          getRecentOrdersForNotifications(),
          getRecentReservationsForNotifications(),
        ])

        const dayMs = 24 * 60 * 60 * 1000
        const isFresh = (row) => {
          if (row.status === 'pendente') return true
          const t = new Date(row.created_at).getTime()
          return Number.isFinite(t) && Date.now() - t < dayMs
        }

        const freshOrders = (orders || []).filter(isFresh)
        const freshReservations = (reservations || []).filter(isFresh)

        // Na primeira carga: preencher o sino sem spam de toasts
        const silent = !bootstrapped.current || !alertNew
        for (const row of freshOrders) {
          pushNotification(buildOrderNotification(row), { silent })
        }
        for (const row of freshReservations) {
          pushNotification(buildReservationNotification(row), { silent })
        }
        bootstrapped.current = true
      } catch (err) {
        console.warn('Falha ao sincronizar notificações', err)
      }
    },
    [isStoreAdmin, pushNotification],
  )

  const requestPermission = useCallback(async () => {
    const next = await ensureBrowserNotificationPermission()
    setPermission(next)
    return next
  }, [])

  // Polling + sync inicial (fiável mesmo sem Realtime)
  useEffect(() => {
    if (authLoading || !isStoreAdmin || !isSupabaseConfigured || !user?.id) return undefined

    void syncFromServer({ alertNew: false })
    const timer = window.setInterval(() => {
      void syncFromServer({ alertNew: true })
    }, POLL_MS)

    function onFocus() {
      void syncFromServer({ alertNew: true })
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [authLoading, isStoreAdmin, user?.id, syncFromServer])

  // Realtime (instantâneo quando a publication estiver activa)
  useEffect(() => {
    if (authLoading || !isStoreAdmin || !isSupabaseConfigured || !supabase) return undefined

    void requestPermission()

    const channel = supabase
      .channel(`admin-ops-${user?.id || 'store'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (!ready.current) return
          pushNotification(buildOrderNotification(payload.new || {}))
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          if (!ready.current) return
          pushNotification(buildReservationNotification(payload.new || {}))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [authLoading, isStoreAdmin, user?.id, pushNotification, requestPermission])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const markRead = useCallback((id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    for (const item of items) acknowledgedIds.current.add(item.id)
    persistAck()
    setItems([])
    knownIds.current = new Set()
  }, [items, persistAck])

  const value = useMemo(
    () => ({
      enabled: Boolean(isStoreAdmin),
      items,
      unreadCount,
      permission,
      requestPermission,
      markRead,
      markAllRead,
      clearAll,
      pushNotification,
      refreshNotifications: () => syncFromServer({ alertNew: true }),
    }),
    [
      isStoreAdmin,
      items,
      unreadCount,
      permission,
      requestPermission,
      markRead,
      markAllRead,
      clearAll,
      pushNotification,
      syncFromServer,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications deve ser usado dentro de NotificationProvider')
  return ctx
}
