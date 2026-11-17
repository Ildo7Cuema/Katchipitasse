import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BedDouble, CheckCheck, ShoppingBag, Trash2 } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDate } from '@/lib/format'

function timeLabel(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return formatDate(value)
  }
}

export default function AdminNotificationBell({ variant = 'dark' }) {
  const { enabled, items, unreadCount, permission, requestPermission, markRead, markAllRead, clearAll } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  if (!enabled) return null

  const dark = variant === 'dark'

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
          dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-brand-950/5 text-brand-950 hover:bg-brand-950/10'
        }`}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-xl ${
            dark ? 'border-white/10 bg-brand-950 text-white' : 'border-brand-950/10 bg-white text-brand-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notificações</p>
              <p className={`text-xs ${dark ? 'text-white/60' : 'text-ink-500'}`}>
                Novos pedidos e reservas
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                title="Marcar tudo como lido"
                className={`rounded-lg p-2 ${dark ? 'hover:bg-white/10' : 'hover:bg-sand-100'}`}
                onClick={markAllRead}
              >
                <CheckCheck size={16} />
              </button>
              <button
                type="button"
                title="Limpar"
                className={`rounded-lg p-2 ${dark ? 'hover:bg-white/10' : 'hover:bg-sand-100'}`}
                onClick={clearAll}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {permission !== 'granted' && permission !== 'unsupported' ? (
            <div className={`border-b px-4 py-3 text-xs ${dark ? 'border-white/10 bg-white/5' : 'border-brand-950/5 bg-sand-100'}`}>
              <p className={dark ? 'text-white/80' : 'text-ink-700'}>
                Active as notificações do sistema para alertas mesmo com o painel em segundo plano.
              </p>
              <button
                type="button"
                className="mt-2 font-semibold text-clay-500"
                onClick={() => requestPermission()}
              >
                Activar notificações
              </button>
            </div>
          ) : null}

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className={`px-4 py-8 text-center text-sm ${dark ? 'text-white/55' : 'text-ink-500'}`}>
                Sem notificações por agora.
              </p>
            ) : (
              items.map((item) => {
                const Icon = item.type === 'reservation' ? BedDouble : ShoppingBag
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => {
                      markRead(item.id)
                      setOpen(false)
                    }}
                    className={`flex gap-3 border-b px-4 py-3 transition ${
                      dark
                        ? `border-white/8 hover:bg-white/5 ${item.read ? 'opacity-70' : 'bg-clay-500/10'}`
                        : `border-brand-950/5 hover:bg-sand-100 ${item.read ? 'opacity-70' : 'bg-clay-500/5'}`
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        dark ? 'bg-white/10 text-clay-500' : 'bg-clay-500/10 text-clay-600'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className={`mt-0.5 truncate text-xs ${dark ? 'text-white/65' : 'text-ink-500'}`}>
                        {item.body}
                      </p>
                      <p className={`mt-1 text-[11px] ${dark ? 'text-white/45' : 'text-ink-300'}`}>
                        {timeLabel(item.createdAt)}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
