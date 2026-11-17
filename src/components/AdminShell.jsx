import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  BedDouble,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  CalendarDays,
  Tags,
  Shield,
  Activity,
  CreditCard,
  Eye,
  Scale,
  WalletCards,
} from 'lucide-react'
import AdminNotificationBell from '@/components/AdminNotificationBell'
import AppLockScreen from '@/components/AppLockScreen'
import BrandLogo from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { usePlatformAccess } from '@/contexts/PlatformAccessContext'
import { Button } from '@/components/ui'
import { roleLabel } from '@/lib/roles'

const storeLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categorias', label: 'Categorias', icon: Tags },
  { to: '/admin/pratos', label: 'Pratos', icon: UtensilsCrossed },
  { to: '/admin/quartos', label: 'Quartos', icon: BedDouble },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/assinatura', label: 'Assinatura', icon: CreditCard },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: WalletCards },
  { to: '/admin/configuracoes', label: 'Páginas públicas', icon: Settings },
]

const superLinks = [
  { to: '/admin', label: 'Monitorização', icon: Activity, end: true },
  { to: '/admin/utilizacao', label: 'Utilização', icon: Eye },
  { to: '/admin/assinaturas', label: 'Assinatura', icon: CreditCard },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: WalletCards },
  { to: '/admin/regras', label: 'Regras', icon: Scale },
  { to: '/admin/plataforma', label: 'Configurações', icon: Settings },
  { to: '/admin/utilizadores', label: 'Utilizadores', icon: Shield },
]

function SidebarBrand({ settings, profile, isSuperAdmin }) {
  return (
    <div className="shrink-0 px-5 py-5">
      <div className="rounded-xl bg-white p-3">
        <BrandLogo
          src={settings.logo_url || '/logo.png'}
          alt={settings.company_name}
          className="bg-transparent"
          imgClassName="max-h-12"
        />
      </div>
      <p className="mt-3 text-sm font-semibold">
        {isSuperAdmin ? 'Painel Plataforma' : 'Painel da Loja'}
      </p>
      <p className="mt-1 text-xs text-white/60">{profile?.full_name}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-clay-500">
        {roleLabel(profile?.role)}
      </p>
    </div>
  )
}

function SidebarNav({ links }) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
              isActive ? 'bg-clay-500 text-white' : 'text-white/65 hover:bg-white/10'
            }`
          }
        >
          <Icon size={16} /> {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminShell() {
  const { profile, signOut, isSuperAdmin, isStoreAdmin } = useAuth()
  const { settings } = useCompany()
  const { isAppBlocked, loading: lockLoading } = usePlatformAccess()
  const location = useLocation()
  const links = isSuperAdmin ? superLinks : storeLinks
  const onStoreSubscriptionPage =
    location.pathname === '/admin/assinatura' || location.pathname.startsWith('/admin/assinatura/')

  // App bloqueada: admin da loja só pode aceder à página de pagamento/assinatura
  if (!lockLoading && isAppBlocked && !isSuperAdmin && !(isStoreAdmin && onStoreSubscriptionPage)) {
    return <AppLockScreen variant="admin" />
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-sand-100">
      {/* Sidebar desktop — fixa */}
      <aside className="hidden h-dvh w-60 shrink-0 flex-col border-r border-brand-800/10 bg-brand-950 text-white md:flex">
        <div className="flex items-start justify-between gap-2 pr-3">
          <SidebarBrand settings={settings} profile={profile} isSuperAdmin={isSuperAdmin} />
          {isStoreAdmin ? (
            <div className="pt-5">
              <AdminNotificationBell variant="dark" />
            </div>
          ) : null}
        </div>
        <SidebarNav links={links} />
        <div className="shrink-0 space-y-2 px-4 pb-6 pt-2">
          <Link to="/">
            <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
              Ver app
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10"
            onClick={() => signOut()}
          >
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Topo — fixo (mobile + desktop com sino) */}
        <header className="sticky top-0 z-40 shrink-0 border-b border-brand-800/20 bg-brand-950 text-white">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="rounded-lg bg-white px-2 py-1.5 md:hidden">
              <BrandLogo
                src={settings.logo_url || '/logo.png'}
                alt={settings.company_name}
                className="bg-transparent"
                imgClassName="max-h-8"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold md:hidden">
                {isSuperAdmin ? 'Plataforma' : 'Loja'}
              </p>
              <p className="hidden truncate text-sm font-semibold md:block">
                {isStoreAdmin ? 'Notificações e operação da loja' : 'Painel da plataforma'}
              </p>
              <p className="truncate text-[11px] uppercase tracking-wide text-clay-500 md:hidden">
                {roleLabel(profile?.role)}
              </p>
            </div>
            {isStoreAdmin ? <AdminNotificationBell variant="dark" /> : null}
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition ${
                    isActive ? 'bg-clay-500 text-white' : 'bg-white/5 text-white/70'
                  }`
                }
              >
                <Icon size={14} /> {label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Só o conteúdo principal rola */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-8 md:py-6">
          {isAppBlocked && isSuperAdmin ? (
            <div className="mb-4 rounded-2xl bg-clay-500 px-4 py-3 text-sm text-white">
              Aplicação bloqueada para clientes e admin da loja. Pode gerir a assinatura e desbloquear em{' '}
              <Link to="/admin/assinaturas" className="font-semibold underline">
                Assinatura anual
              </Link>
              .
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
