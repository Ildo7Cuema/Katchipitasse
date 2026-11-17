import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BedDouble, Home, LogOut, UtensilsCrossed, UserRound } from 'lucide-react'
import AdminNotificationBell from '@/components/AdminNotificationBell'
import AppLockScreen from '@/components/AppLockScreen'
import BrandLogo from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { usePlatformAccess } from '@/contexts/PlatformAccessContext'
import { isSupabaseConfigured } from '@/lib/supabase'

const tabs = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/restaurante', label: 'Restaurante', icon: UtensilsCrossed },
  { to: '/hospedaria', label: 'Hospedaria', icon: BedDouble },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

const openWhenLocked = ['/entrar', '/registar', '/recuperar-password', '/redefinir-password', '/privacidade']

export default function AppShell() {
  const { settings } = useCompany()
  const { user, isSuperAdmin, isStoreAdmin, loading: authLoading, signOut } = useAuth()
  const { isAppBlocked, loading: lockLoading } = usePlatformAccess()
  const location = useLocation()
  const allowAuthRoutes = openWhenLocked.some((path) => location.pathname.startsWith(path))

  if (!authLoading && !lockLoading && isAppBlocked && !isSuperAdmin && !allowAuthRoutes) {
    return <AppLockScreen />
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-sand-100/80 shadow-[0_0_80px_rgba(0,0,0,0.08)] md:max-w-none md:bg-transparent md:shadow-none">
      {!isSupabaseConfigured ? (
        <div className="shrink-0 bg-warning/20 px-4 py-2 text-center text-xs text-ink-700">
          Modo demonstração: configure o Supabase em <code>.env</code> para dados reais.
        </div>
      ) : null}

      {isAppBlocked && isSuperAdmin ? (
        <div className="shrink-0 bg-clay-500 px-4 py-2 text-center text-xs font-medium text-white">
          App bloqueada para clientes e admin da loja. Só o Super Admin mantém acesso.
        </div>
      ) : null}

      {/* Topo fixo */}
      <header className="pt-safe sticky top-0 z-40 shrink-0 border-b border-brand-950/10 bg-white/95 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLogo
            src={settings.logo_url || '/logo.png'}
            alt={settings.company_name}
            className="max-w-[160px] bg-transparent md:max-w-[240px]"
            imgClassName="max-h-11 md:max-h-14"
          />
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isStoreAdmin ? <AdminNotificationBell variant="light" /> : null}
            <nav className="hidden md:block">
              <ul className="flex items-center gap-1">
                {tabs.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          isActive ? 'bg-clay-500/10 text-clay-600' : 'text-ink-500 hover:text-brand-950'
                        }`
                      }
                    >
                      <Icon size={16} strokeWidth={2.1} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-ink-500 transition hover:bg-clay-500/10 hover:text-clay-600 md:ml-1"
                aria-label="Terminar sessão"
                title="Terminar sessão"
              >
                <LogOut size={18} strokeWidth={2.1} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Conteúdo com scroll próprio */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-4 md:mx-auto md:w-full md:max-w-5xl md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/* Navegação inferior fixa (mobile) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-brand-950/10 bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium transition ${
                    isActive ? 'text-clay-500' : 'text-ink-500 hover:text-brand-950'
                  }`
                }
              >
                <Icon size={20} strokeWidth={2.1} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
