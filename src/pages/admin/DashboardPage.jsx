import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BedDouble,
  CalendarDays,
  CreditCard,
  Scale,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Shield,
} from 'lucide-react'
import { AdminHero, Panel, StatCard } from '@/components/AdminUI'
import { Button, Spinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate } from '@/lib/format'
import { getDashboardStats, getSubscription, getSystemRules } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function DashboardPage() {
  const { profile, isSuperAdmin, isStoreAdmin } = useAuth()
  const { unreadCount, permission, requestPermission } = useNotifications()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [rulesCount, setRulesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!isSupabaseConfigured) {
        setStats({ customers: 0, orders: 0, reservations: 0, pendingReservations: 0, activeRooms: 0, staff: 0 })
        setLoading(false)
        return
      }
      try {
        const data = await getDashboardStats()
        if (!mounted) return
        setStats(data)
        if (isSuperAdmin) {
          try {
            const [sub, rules] = await Promise.all([getSubscription(), getSystemRules()])
            if (!mounted) return
            setSubscription(sub)
            setRulesCount(rules.filter((r) => r.is_active).length)
          } catch {
            /* migration 003 opcional */
          }
        }
      } catch (err) {
        toast.error(err.message || 'Erro no dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast, isSuperAdmin])

  if (isSuperAdmin) {
    const cards = [
      { label: 'Clientes', value: stats?.customers, icon: Users, tone: 'default' },
      { label: 'Pedidos', value: stats?.orders, icon: ShoppingBag, tone: 'default' },
      { label: 'Pedidos pendentes', value: stats?.pendingOrders, icon: Activity, tone: 'accent' },
      { label: 'Reservas', value: stats?.reservations, icon: CalendarDays, tone: 'default' },
      { label: 'Reservas pendentes', value: stats?.pendingReservations, icon: CalendarDays, tone: 'dark' },
      { label: 'Admins loja', value: stats?.staff, icon: Shield, tone: 'default' },
      { label: 'Pratos activos', value: stats?.activeDishes, icon: UtensilsCrossed, tone: 'default' },
      { label: 'Quartos activos', value: stats?.activeRooms, icon: BedDouble, tone: 'default' },
      { label: 'Regras activas', value: rulesCount, icon: Scale, tone: 'default' },
    ]

    return (
      <div className="animate-fade-in space-y-6">
        <AdminHero
          tone="accent"
          eyebrow="Super Admin"
          title="Monitorização do sistema"
          description={`Olá, ${profile?.full_name || 'Produtor'}. Acompanhe o uso da aplicação, assinaturas e regras da plataforma — sem interferir na operação diária da loja.`}
          icon={Activity}
          actions={
            <>
              <Link to="/admin/utilizacao">
                <Button variant="light">Utilização</Button>
              </Link>
              <Link to="/admin/assinaturas">
                <Button variant="outlineLight">Assinaturas</Button>
              </Link>
              <Link to="/admin/regras">
                <Button variant="outlineLight">Regras</Button>
              </Link>
            </>
          }
        />

        <Panel
          title="Assinatura anual"
          description="Contrato único da aplicação, valor anual e bloqueio de acesso."
          icon={CreditCard}
          actions={
            <Link to="/admin/assinaturas">
              <Button variant="outline">Gerir</Button>
            </Link>
          }
        >
          {subscription ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Plano</p>
                <p className="mt-1 font-display text-2xl text-brand-950">{subscription.plan_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Valor anual</p>
                <p className="mt-1 text-lg font-semibold text-brand-950">
                  {formatCurrency(subscription.annual_fee ?? subscription.monthly_fee ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Estado</p>
                <p className="mt-1 text-lg font-semibold capitalize text-clay-600">
                  {subscription.is_blocked ? 'Bloqueada' : subscription.status}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Validade</p>
                <p className="mt-1 text-lg font-semibold text-brand-950">
                  {subscription.ends_at ? formatDate(subscription.ends_at) : 'Sem data de fim'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">
              Execute as migrations <code>003</code> e <code>004</code> para activar a assinatura anual.
            </p>
          )}
        </Panel>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                tone={card.tone}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const storeCards = [
    { label: 'Clientes', value: stats?.customers, icon: Users },
    { label: 'Pedidos', value: stats?.orders, icon: ShoppingBag },
    { label: 'Pedidos pendentes', value: stats?.pendingOrders, icon: Activity, tone: 'accent' },
    { label: 'Reservas', value: stats?.reservations, icon: CalendarDays },
    { label: 'Reservas pendentes', value: stats?.pendingReservations, icon: CalendarDays, tone: 'dark' },
    { label: 'Quartos activos', value: stats?.activeRooms, icon: BedDouble },
  ]

  const storeActions = [
    { to: '/admin/pedidos', title: 'Pedidos', description: 'Gerir solicitações do restaurante', icon: ShoppingBag },
    { to: '/admin/reservas', title: 'Reservas', description: 'Confirmar hospedagens', icon: CalendarDays },
    { to: '/admin/pratos', title: 'Pratos', description: 'Atualizar o menu', icon: UtensilsCrossed },
    { to: '/admin/quartos', title: 'Quartos', description: 'Preços e tipologias', icon: BedDouble },
    { to: '/admin/clientes', title: 'Clientes', description: 'Contas da aplicação', icon: Users },
    { to: '/admin/assinatura', title: 'Assinatura', description: 'Pagar e renovar o contrato anual', icon: CreditCard },
    { to: '/admin/configuracoes', title: 'Páginas públicas', description: 'Contactos, morada e imagens', icon: Shield },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="dark"
        eyebrow="Admin da loja"
        title="Gestão da loja"
        description={`Bem-vindo, ${profile?.full_name || 'Administrador'}. Controlo total de serviços, pedidos, reservas e configurações do estabelecimento.`}
        icon={ShoppingBag}
        actions={
          <>
            <Link to="/admin/pedidos">
              <Button>Ver pedidos</Button>
            </Link>
            <Link to="/admin/reservas">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Ver reservas
              </Button>
            </Link>
          </>
        }
      />

      {isStoreAdmin ? (
        <Panel
          title="Alertas em tempo real"
          description="Recebe notificações quando chega um novo pedido ou reserva."
          icon={Activity}
          actions={
            permission !== 'granted' ? (
              <Button variant="outline" onClick={() => requestPermission()}>
                Activar alertas do sistema
              </Button>
            ) : null
          }
        >
          <p className="text-sm text-ink-700">
            {unreadCount > 0
              ? `Tem ${unreadCount} notificação(ões) por ler. Use o ícone do sino no topo.`
              : 'Sem alertas por ler. O sino no topo mostra novos pedidos e reservas automaticamente.'}
          </p>
        </Panel>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {storeCards.map((card) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                tone={card.tone || 'default'}
              />
            ))}
          </div>

          <Panel
            title="Serviços da loja"
            description="Atalhos para a operação diária — exclusivos do admin do estabelecimento."
            icon={UtensilsCrossed}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {storeActions.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-2xl border border-brand-950/8 bg-sand-100/70 p-4 transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-950 text-white">
                      <Icon size={16} />
                    </div>
                    <p className="mt-3 font-display text-lg text-brand-950">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-500">{item.description}</p>
                  </Link>
                )
              })}
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
