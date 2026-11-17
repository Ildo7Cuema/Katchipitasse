import { useEffect, useState } from 'react'
import { Activity, Eye, MonitorSmartphone, Users } from 'lucide-react'
import { AdminHero, Panel, StatCard } from '@/components/AdminUI'
import { Badge, EmptyState, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime } from '@/lib/format'
import { roleLabel } from '@/lib/roles'
import { channelLabel, eventTypeLabel } from '@/lib/usageChannel'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  getActiveUsers,
  getPlatformUsageSummary,
  getRecentUsageEvents,
} from '@/services/api'

const WINDOW_OPTIONS = [
  { value: '24', label: 'Últimas 24 horas' },
  { value: '72', label: 'Últimos 3 dias' },
  { value: '168', label: 'Últimos 7 dias' },
]

export default function UsageMonitorPage() {
  const toast = useToast()
  const [hours, setHours] = useState('24')
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [activeUsers, setActiveUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const h = Number(hours) || 24
        const [sum, recent, active] = await Promise.all([
          getPlatformUsageSummary(h),
          getRecentUsageEvents(100),
          getActiveUsers(h),
        ])
        if (!mounted) return
        setSummary(sum)
        setEvents(recent)
        setActiveUsers(active)
      } catch (err) {
        toast.error(
          err.message?.includes('schema') || err.message?.includes('function')
            ? 'Execute a migration 012_app_usage_monitoring.sql no Supabase.'
            : err.message || 'Erro ao carregar utilização',
        )
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [hours, toast])

  const byChannel = summary?.by_channel || {}
  const byRole = summary?.by_role || {}
  const topPaths = summary?.top_paths || []

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="accent"
        eyebrow="Plataforma"
        title="Utilização da app"
        description="Quem está a usar, quando e por que canal (browser, PWA ou app nativa)."
        icon={Activity}
        actions={
          <label className="block text-left">
            <span className="sr-only">Período</span>
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              {WINDOW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-brand-950">
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !isSupabaseConfigured ? (
        <EmptyState title="Supabase" description="Configure o Supabase para ver a utilização." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sessões" value={summary?.sessions ?? 0} icon={MonitorSmartphone} tone="dark" />
            <StatCard label="Páginas vistas" value={summary?.page_views ?? 0} icon={Eye} tone="default" />
            <StatCard label="Utilizadores únicos" value={summary?.unique_users ?? 0} icon={Users} tone="accent" />
            <StatCard
              label="Visitantes anónimos"
              value={summary?.unique_guests ?? 0}
              icon={Users}
              tone="default"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Como acedem" description="Canal de utilização no período." icon={MonitorSmartphone}>
              <ul className="space-y-2 text-sm">
                {Object.keys(byChannel).length === 0 ? (
                  <li className="text-ink-500">Sem dados neste período.</li>
                ) : (
                  Object.entries(byChannel).map(([channel, count]) => (
                    <li key={channel} className="flex items-center justify-between rounded-xl bg-sand-100/80 px-3 py-2">
                      <span>{channelLabel(channel)}</span>
                      <Badge>{count}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </Panel>

            <Panel title="Quem acede" description="Eventos por tipo de perfil." icon={Users}>
              <ul className="space-y-2 text-sm">
                {Object.keys(byRole).length === 0 ? (
                  <li className="text-ink-500">Sem dados neste período.</li>
                ) : (
                  Object.entries(byRole).map(([role, count]) => (
                    <li key={role} className="flex items-center justify-between rounded-xl bg-sand-100/80 px-3 py-2">
                      <span>{role === 'anonimo' ? 'Visitante' : roleLabel(role)}</span>
                      <Badge>{count}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>

          <Panel title="Páginas mais vistas" description="Top caminhos no período." icon={Eye}>
            {topPaths.length === 0 ? (
              <p className="text-sm text-ink-500">Sem páginas registadas.</p>
            ) : (
              <ul className="divide-y divide-brand-950/5 text-sm">
                {topPaths.map((row) => (
                  <li key={row.path} className="flex items-center justify-between py-2.5">
                    <code className="truncate text-xs text-brand-950">{row.path}</code>
                    <span className="ml-3 shrink-0 font-semibold text-ink-600">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Utilizadores activos"
            description="Perfis com actividade recente (last seen)."
            icon={Users}
          >
            {activeUsers.length === 0 ? (
              <p className="text-sm text-ink-500">Ninguém activo neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="py-2 pr-3">Nome</th>
                      <th className="py-2 pr-3">Papel</th>
                      <th className="py-2 pr-3">Contacto</th>
                      <th className="py-2">Última actividade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((u) => (
                      <tr key={u.id} className="border-t border-brand-950/5">
                        <td className="py-2.5 pr-3 font-medium text-brand-950">{u.full_name}</td>
                        <td className="py-2.5 pr-3">{roleLabel(u.role)}</td>
                        <td className="py-2.5 pr-3 text-ink-600">
                          {u.email || u.phone || '—'}
                        </td>
                        <td className="py-2.5 text-ink-600">{formatDateTime(u.last_seen_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Actividade recente" description="Linha do tempo de uso." icon={Activity}>
            {events.length === 0 ? (
              <p className="text-sm text-ink-500">Sem eventos ainda.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((ev) => {
                  const name =
                    ev.profiles?.full_name ||
                    (ev.user_id ? 'Utilizador' : `Visitante ${ev.guest_key?.slice(0, 8) || ''}`)
                  return (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-1 rounded-2xl bg-sand-100/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-950">
                          {name}{' '}
                          <span className="font-normal text-ink-500">
                            · {eventTypeLabel(ev.event_type)}
                          </span>
                        </p>
                        <p className="truncate text-xs text-ink-500">
                          {ev.path || '—'} · {channelLabel(ev.channel)} ·{' '}
                          {roleLabel(ev.role || ev.profiles?.role) || 'Visitante'}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-ink-500">{formatDateTime(ev.created_at)}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
