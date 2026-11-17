import { Link } from 'react-router-dom'
import { CreditCard, Eye, Scale, Settings2, Shield, Store, WalletCards } from 'lucide-react'
import { AdminHero } from '@/components/AdminUI'

const tiles = [
  {
    to: '/admin/utilizacao',
    icon: Eye,
    title: 'Utilização',
    description: 'Quem usa a app, quando e por que canal.',
    dark: false,
  },
  {
    to: '/admin/assinaturas',
    icon: CreditCard,
    title: 'Assinatura anual',
    description: 'Valor anual, validade e bloqueio da aplicação.',
    dark: false,
  },
  {
    to: '/admin/pagamentos',
    icon: WalletCards,
    title: 'GPO de pagamentos',
    description: 'WhatsApp, IBAN e métodos para receber comprovativos.',
    dark: false,
  },
  {
    to: '/admin/regras',
    icon: Scale,
    title: 'Regras',
    description: 'Políticas de reservas, pedidos e cancelamentos.',
    dark: false,
  },
  {
    to: '/admin/utilizadores',
    icon: Shield,
    title: 'Utilizadores e papéis',
    description: 'Promover ou restringir contas da plataforma.',
    dark: true,
  },
]

export default function PlatformSettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="light"
        eyebrow="Plataforma"
        title="Configurações do produtor"
        description="Centro de controlo da aplicação. A operação da loja permanece com o admin do estabelecimento."
        icon={Settings2}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className={`group rounded-3xl p-5 shadow-sm transition hover:-translate-y-0.5 ${
                tile.dark ? 'bg-brand-950 text-white' : 'bg-white text-brand-950'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  tile.dark ? 'bg-clay-500 text-white' : 'bg-clay-500/10 text-clay-600'
                }`}
              >
                <Icon size={18} />
              </div>
              <p className="mt-4 font-display text-xl">{tile.title}</p>
              <p className={`mt-2 text-sm ${tile.dark ? 'text-white/70' : 'text-ink-500'}`}>
                {tile.description}
              </p>
              <span className={`mt-4 inline-flex text-sm font-semibold ${tile.dark ? 'text-clay-500' : 'text-clay-600'}`}>
                Abrir →
              </span>
            </Link>
          )
        })}
      </div>

      <div className="rounded-3xl border border-brand-950/8 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-200 text-brand-950">
            <Store size={18} />
          </div>
          <div>
            <h2 className="font-display text-xl text-brand-950">Operação da loja</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-500">
              Pratos, quartos, pedidos, reservas e contactos da empresa são geridos exclusivamente pelo
              admin da loja. O Super Admin monitoriza e define regras, sem substituir a operação.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
