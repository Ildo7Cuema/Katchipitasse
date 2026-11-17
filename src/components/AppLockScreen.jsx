import { Link } from 'react-router-dom'
import { CreditCard, LockKeyhole, ShieldAlert } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { usePlatformAccess } from '@/contexts/PlatformAccessContext'

export default function AppLockScreen({ variant = 'app' }) {
  const { settings } = useCompany()
  const { isSuperAdmin, isStoreAdmin, isAdmin, signOut } = useAuth()
  const { blockReason } = usePlatformAccess()

  return (
    <div
      className={`flex min-h-dvh items-center justify-center px-4 py-10 ${
        variant === 'admin' ? 'bg-brand-950' : 'bg-gradient-to-br from-brand-950 via-[#1a0909] to-clay-800'
      }`}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-brand-950 px-6 py-5">
          <BrandLogo
            src={settings.logo_url || '/logo.png'}
            alt={settings.company_name}
            className="mx-auto max-w-[200px] bg-white/95 p-3"
            imgClassName="max-h-12"
          />
        </div>

        <div className="space-y-5 p-6 md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-600">
            <LockKeyhole size={28} />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay-600">Acesso suspenso</p>
            <h1 className="mt-2 font-display text-3xl text-brand-950">Aplicação bloqueada</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              {blockReason ||
                'A aplicação está temporariamente indisponível devido a irregularidade na assinatura anual ou a uma situação de risco definida pelo produtor.'}
            </p>
          </div>

          <div className="rounded-2xl border border-brand-950/8 bg-sand-100/80 p-4 text-sm text-ink-700">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 shrink-0 text-clay-600" size={18} />
              <p>
                {isStoreAdmin
                  ? 'Regularize o pagamento da assinatura anual para solicitar a reactivação da aplicação.'
                  : 'O admin da loja pode pagar a assinatura anual; o Super Admin valida e desbloqueia a app.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isSuperAdmin ? (
              <Link to="/admin/assinaturas">
                <Button>Gerir assinatura e desbloquear</Button>
              </Link>
            ) : isStoreAdmin ? (
              <Link to="/admin/assinatura">
                <Button>
                  <CreditCard size={16} /> Pagar assinatura anual
                </Button>
              </Link>
            ) : isAdmin ? (
              <Link to="/entrar">
                <Button variant="secondary">Entrar</Button>
              </Link>
            ) : (
              <Link to="/entrar">
                <Button variant="secondary">Entrar</Button>
              </Link>
            )}
            {isAdmin || isSuperAdmin ? (
              <Button variant="outline" onClick={() => signOut()}>
                Terminar sessão
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
