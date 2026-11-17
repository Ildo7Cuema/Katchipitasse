import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BedDouble,
  CalendarDays,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  ShoppingBag,
  Tags,
  UserRound,
  Users,
  UtensilsCrossed,
  Activity,
  CreditCard,
  Eye,
  Scale,
  WalletCards,
} from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { OrderHistoryCard, QuickAction, ReservationHistoryCard } from '@/components/ClientUI'
import { Badge, Button, EmptyState, Input, Spinner } from '@/components/ui'
import RequireAuth from '@/components/RequireAuth'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate, statusLabel, statusTone } from '@/lib/format'
import { roleLabel } from '@/lib/roles'
import { getMyOrders, getMyReservations, updateProfile } from '@/services/api'

const storeHub = [
  { to: '/admin', title: 'Dashboard da loja', description: 'Resumo operacional do dia', icon: ShoppingBag },
  { to: '/admin/pedidos', title: 'Pedidos', description: 'Confirmar e actualizar estados', icon: ShoppingBag },
  { to: '/admin/reservas', title: 'Reservas', description: 'Hospedagem e disponibilidade', icon: CalendarDays },
  { to: '/admin/pratos', title: 'Pratos', description: 'Catálogo do restaurante', icon: UtensilsCrossed },
  { to: '/admin/categorias', title: 'Categorias', description: 'Organização do menu', icon: Tags },
  { to: '/admin/quartos', title: 'Quartos', description: 'Tipologias e preços', icon: BedDouble },
  { to: '/admin/clientes', title: 'Clientes', description: 'Contas registadas na app', icon: Users },
  { to: '/admin/assinatura', title: 'Assinatura anual', description: 'Estado, pagamento e renovação', icon: CreditCard },
  { to: '/admin/pagamentos', title: 'Pagamentos (GPO)', description: 'Receber pagamentos dos clientes', icon: WalletCards },
  { to: '/admin/configuracoes', title: 'Páginas públicas', description: 'Contactos, morada e imagens (upload)', icon: Settings },
]

const platformHub = [
  { to: '/admin', title: 'Monitorização', description: 'Uso e saúde da plataforma', icon: Activity },
  { to: '/admin/utilizacao', title: 'Utilização', description: 'Quem, quando e como usa a app', icon: Eye },
  { to: '/admin/assinaturas', title: 'Assinatura anual', description: 'Valor, validade e bloqueio da app', icon: CreditCard },
  { to: '/admin/pagamentos', title: 'Pagamentos (GPO)', description: 'Destino dos comprovativos da assinatura', icon: WalletCards },
  { to: '/admin/regras', title: 'Regras', description: 'Políticas da aplicação', icon: Scale },
  { to: '/admin/utilizadores', title: 'Utilizadores', description: 'Papéis e acessos', icon: Shield },
  { to: '/admin/plataforma', title: 'Configurações', description: 'Centro do produtor', icon: Settings },
]

function HubCard({ to, title, description, icon: Icon, dark = false }) {
  return (
    <Link
      to={to}
      className={`rounded-3xl p-5 shadow-sm transition hover:-translate-y-0.5 ${
        dark ? 'bg-brand-950 text-white' : 'bg-white text-brand-950'
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          dark ? 'bg-clay-500 text-white' : 'bg-clay-500/10 text-clay-600'
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className={`mt-2 text-sm ${dark ? 'text-white/70' : 'text-ink-500'}`}>{description}</p>
    </Link>
  )
}

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile, isStoreAdmin, isSuperAdmin } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
  }, [profile])

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(user.id, { full_name: fullName.trim(), phone: phone.trim() })
      await refreshProfile()
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  const badgeClass = isSuperAdmin
    ? 'bg-clay-500/15 text-clay-700'
    : isStoreAdmin
      ? 'bg-brand-950 text-white'
      : 'bg-brand-950/10 text-brand-950'

  return (
    <RequireAuth>
      <div className="animate-fade-up space-y-6">
        <AdminHero
          tone={isStoreAdmin ? 'dark' : isSuperAdmin ? 'accent' : 'light'}
          eyebrow={
            isStoreAdmin ? 'Admin da loja' : isSuperAdmin ? 'Produtor da plataforma' : 'A minha conta'
          }
          title={profile?.full_name || 'O seu perfil'}
          description={
            isStoreAdmin
              ? 'Controlo total da operação: menu, hospedaria, pedidos, reservas e clientes.'
              : isSuperAdmin
                ? 'Monitorização, assinatura anual, regras e gestão de papéis — sem operar a loja.'
                : user?.email
          }
          icon={isStoreAdmin || isSuperAdmin ? Shield : UserRound}
          actions={<Badge className={badgeClass}>{roleLabel(profile?.role)}</Badge>}
        />

        {isStoreAdmin ? (
          <Panel
            title="Gestão da loja"
            description="Serviços exclusivos do administrador do estabelecimento."
            icon={ShoppingBag}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {storeHub.map((item, index) => (
                <HubCard key={item.to} {...item} dark={index === 0} />
              ))}
            </div>
          </Panel>
        ) : null}

        {isSuperAdmin ? (
          <Panel
            title="Gestão da plataforma"
            description="Serviços exclusivos do Super Admin. A operação diária da loja pertence ao admin."
            icon={Activity}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {platformHub.map((item, index) => (
                <HubCard key={item.to} {...item} dark={index === 0} />
              ))}
            </div>
          </Panel>
        ) : null}

        {!isStoreAdmin && !isSuperAdmin ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              to="/perfil/pedidos"
              title="Os meus pedidos"
              description="Acompanhar solicitações do restaurante"
              icon={ShoppingBag}
              tone="accent"
            />
            <QuickAction
              to="/perfil/reservas"
              title="As minhas reservas"
              description="Estado das reservas da hospedaria"
              icon={BedDouble}
              tone="dark"
            />
            <QuickAction
              to="/restaurante"
              title="Pedir refeição"
              description="Ver menu e solicitar pratos"
              icon={UtensilsCrossed}
            />
            <QuickAction
              to="/contactos"
              title="Contactos"
              description="Telefone, WhatsApp e localização"
              icon={MapPin}
            />
          </div>
        ) : null}

        <Panel title="Dados pessoais" description="Actualize o seu nome e contacto." icon={UserRound}>
          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nome completo"
              icon={UserRound}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Telefone"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input label="E-mail" icon={Mail} value={user?.email || ''} disabled />
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? 'A guardar...' : 'Guardar perfil'}
              </Button>
            </div>
          </form>
        </Panel>

        {(isStoreAdmin || isSuperAdmin) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <HubCard
              to="/perfil/pedidos"
              title="Pedidos pessoais"
              description="Pedidos feitos com esta conta"
              icon={ShoppingBag}
            />
            <HubCard
              to="/perfil/reservas"
              title="Reservas pessoais"
              description="Reservas feitas com esta conta"
              icon={BedDouble}
            />
          </div>
        )}

        <Button variant="outline" onClick={() => signOut()}>
          <LogOut size={16} /> Terminar sessão
        </Button>
      </div>
    </RequireAuth>
  )
}

export function MyOrdersPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getMyOrders(user.id)
        if (mounted) setOrders(data)
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar pedidos')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, toast])

  return (
    <RequireAuth>
      <div className="animate-fade-up space-y-6">
        <AdminHero
          tone="light"
          eyebrow="Conta"
          title="Os meus pedidos"
          description="Histórico visual das suas solicitações no restaurante."
          icon={ShoppingBag}
        />
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Sem pedidos"
            description="Ainda não fez pedidos. Explore o restaurante e peça a sua refeição."
            action={
              <Link to="/restaurante">
                <Button>Ver restaurante</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const lines = order.order_items || []
              const total = lines.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0)
              return (
                <OrderHistoryCard
                  key={order.id}
                  dateLabel={formatDate(order.created_at)}
                  phone={order.customer_phone}
                  status={statusLabel(order.status)}
                  statusClass={statusTone(order.status)}
                  notes={order.notes}
                  totalLabel={formatCurrency(total)}
                  items={lines.map((item) => ({
                    id: item.id,
                    name: item.dish_name || item.dishes?.name || 'Produto',
                    quantity: item.quantity,
                    unitPrice: Number(item.unit_price) || 0,
                    image: item.dishes?.image_url || null,
                  }))}
                />
              )
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}

export function MyReservationsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getMyReservations(user.id)
        if (mounted) setItems(data)
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar reservas')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, toast])

  return (
    <RequireAuth>
      <div className="animate-fade-up space-y-6">
        <AdminHero
          tone="light"
          eyebrow="Conta"
          title="As minhas reservas"
          description="Estadias e pedidos de hospedagem com imagem do quarto."
          icon={BedDouble}
        />
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Sem reservas"
            description="Ainda não tem reservas. Escolha um quarto e peça a sua estadia."
            action={
              <Link to="/hospedaria">
                <Button>Ver hospedaria</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ReservationHistoryCard
                key={item.id}
                title={item.rooms?.name || 'Quarto'}
                image={item.rooms?.image_url}
                dateRange={`${formatDate(item.check_in)} → ${formatDate(item.check_out)}`}
                guests={item.guests}
                status={statusLabel(item.status)}
                statusClass={statusTone(item.status)}
                to={item.room_id ? `/hospedaria/${item.room_id}` : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}
