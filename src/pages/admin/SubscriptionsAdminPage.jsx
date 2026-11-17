import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeDollarSign,
  CalendarRange,
  CreditCard,
  FileText,
  LockKeyhole,
  RefreshCw,
  Shield,
  BedDouble,
  UnlockKeyhole,
  WalletCards,
} from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import { Button, Input, Select, Spinner, TextArea } from '@/components/ui'
import { usePlatformAccess } from '@/contexts/PlatformAccessContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate } from '@/lib/format'
import { displayProofPhone } from '@/lib/paymentGpo'
import { SUBSCRIPTION_PROOF_PHONE } from '@/lib/subscriptionBilling'
import { isPeriodExpired, resolveAnnualPeriod } from '@/lib/subscriptionPeriod'
import {
  confirmSubscriptionPayment,
  getPaymentGpoSafe,
  getSubscription,
  saveSubscription,
  setAppBlocked,
} from '@/services/api'

const statuses = [
  { value: 'trial', label: 'Período experimental' },
  { value: 'active', label: 'Activa' },
  { value: 'suspended', label: 'Suspensa' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'expired', label: 'Expirada' },
]

export default function SubscriptionsAdminPage() {
  const toast = useToast()
  const { refresh: refreshLock, isAppBlocked, blockReason } = usePlatformAccess()
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({
    plan_name: 'Anual',
    status: 'active',
    annual_fee: 0,
    max_admins: 3,
    max_rooms: 20,
    notes: '',
  })
  const [blockFormReason, setBlockFormReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [proofPhone, setProofPhone] = useState(SUBSCRIPTION_PROOF_PHONE)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [data, gpo] = await Promise.all([getSubscription(), getPaymentGpoSafe('platform')])
        if (!mounted) return
        setItem(data)
        setProofPhone(displayProofPhone(gpo) || SUBSCRIPTION_PROOF_PHONE)
        if (data) {
          setForm({
            plan_name: data.plan_name || 'Anual',
            status: data.status || 'active',
            annual_fee: data.annual_fee ?? data.monthly_fee ?? 0,
            max_admins: data.max_admins ?? 3,
            max_rooms: data.max_rooms ?? 20,
            notes: data.notes || '',
          })
          setBlockFormReason(data.block_reason || '')
        }
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar assinatura. Execute as migrations 003 e 004.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  const period = useMemo(() => resolveAnnualPeriod(item), [item])
  const expired = isPeriodExpired(item?.ends_at)

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        plan_name: form.plan_name.trim() || 'Anual',
        status: form.status,
        annual_fee: Number(form.annual_fee) || 0,
        max_admins: Number(form.max_admins) || 1,
        max_rooms: Number(form.max_rooms) || 1,
        notes: form.notes || null,
        is_blocked: Boolean(item?.is_blocked),
        block_reason: item?.block_reason || null,
        blocked_at: item?.blocked_at || null,
        // Se não houver período ou estiver expirado, o sistema cria automaticamente 12 meses
        renew: !item?.starts_at || !item?.ends_at || expired,
      }
      const data = await saveSubscription(payload, item?.id)
      setItem(data)
      await refreshLock()
      toast.success('Assinatura anual actualizada')
    } catch (err) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  async function confirmPayment() {
    setConfirming(true)
    try {
      const data = await confirmSubscriptionPayment()
      setItem(data)
      setForm((prev) => ({
        ...prev,
        status: data.status || 'active',
        annual_fee: data.annual_fee ?? prev.annual_fee,
      }))
      await refreshLock()
      toast.success('Pagamento confirmado — app reactivada com novo ciclo anual')
    } catch (err) {
      toast.error(err.message || 'Erro ao confirmar pagamento. Execute a migration 006.')
    } finally {
      setConfirming(false)
    }
  }

  async function renewAnnualCycle() {
    setRenewing(true)
    try {
      const payload = {
        plan_name: form.plan_name.trim() || 'Anual',
        status: form.status === 'expired' || form.status === 'cancelled' ? 'active' : form.status,
        annual_fee: Number(form.annual_fee) || 0,
        max_admins: Number(form.max_admins) || 1,
        max_rooms: Number(form.max_rooms) || 1,
        notes: form.notes || null,
        is_blocked: false,
        block_reason: null,
        blocked_at: null,
        renew: true,
      }
      const data = await saveSubscription(payload, item?.id)
      setItem(data)
      setForm((prev) => ({ ...prev, status: data.status }))
      await refreshLock()
      toast.success('Novo ciclo anual definido automaticamente (12 meses)')
    } catch (err) {
      toast.error(err.message || 'Erro ao renovar ciclo')
    } finally {
      setRenewing(false)
    }
  }

  async function toggleBlock(blocked) {
    if (blocked && !blockFormReason.trim()) {
      toast.error('Indique o motivo do bloqueio')
      return
    }
    setLocking(true)
    try {
      const data = await setAppBlocked({
        blocked,
        reason: blockFormReason.trim(),
        status: blocked ? 'suspended' : 'active',
        renewOnUnblock: true,
      })
      setItem(data)
      setForm((prev) => ({ ...prev, status: data.status }))
      await refreshLock()
      toast.success(
        blocked
          ? 'Aplicação bloqueada'
          : 'Aplicação desbloqueada — período anual recalculado automaticamente',
      )
    } catch (err) {
      toast.error(err.message || 'Não foi possível alterar o bloqueio')
    } finally {
      setLocking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const locked = Boolean(item?.is_blocked) || isAppBlocked

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="accent"
        eyebrow="Plataforma"
        title="Assinatura anual"
        description="Uma única assinatura anual da aplicação. Defina o valor e bloqueie a app em caso de irregularidade de pagamento ou risco."
        icon={CreditCard}
      />

      <div
        className={`rounded-3xl px-5 py-4 text-sm ${
          locked
            ? 'border border-clay-500/30 bg-clay-500/10 text-brand-950'
            : 'border border-brand-950/8 bg-white text-brand-950'
        }`}
      >
        <p>
          Estado:{' '}
          <strong>{statuses.find((s) => s.value === item?.status)?.label || item?.status || '—'}</strong>
          {item?.ends_at ? ` · válido até ${formatDate(item.ends_at)}` : null}
          {typeof (item?.annual_fee ?? item?.monthly_fee) !== 'undefined'
            ? ` · ${formatCurrency(item?.annual_fee ?? item?.monthly_fee)} / ano`
            : null}
        </p>
        {locked ? (
          <p className="mt-2 font-medium text-clay-700">
            App bloqueada: {blockReason || item?.block_reason || 'Motivo não indicado'}
          </p>
        ) : (
          <p className="mt-2 text-ink-500">Aplicação operacional — assinatura anual activa.</p>
        )}
      </div>

      <Panel
        title="GPO e gateway da app"
        description="Comprovativos e credenciais do banco exclusivos para o pagamento da assinatura."
        icon={WalletCards}
      >
        <p className="text-sm text-ink-700">
          WhatsApp actual: <strong>{proofPhone}</strong>
        </p>
        <p className="mt-2 text-xs text-ink-500">
          O gateway do Super Admin não é partilhado com o Admin da loja (clientes têm GPO própria).
        </p>
        <FormActions className="mt-4">
          <Link to="/admin/pagamentos">
            <Button type="button" variant="secondary">
              Configurar GPO e gateway
            </Button>
          </Link>
        </FormActions>
      </Panel>

      {item?.payment_requested_at ? (
        <Panel
          title="Pagamento pendente de validação"
          description={`O admin da loja registou um pagamento. Confirme o comprovativo recebido no WhatsApp ${proofPhone}.`}
          icon={BadgeDollarSign}
        >
          <div className="space-y-3 text-sm text-ink-700">
            <p>
              Pedido em <strong>{formatDate(item.payment_requested_at)}</strong>
              {item.payment_method ? ` · método: ${item.payment_method}` : ''}
            </p>
            <p className="text-xs text-ink-500">
              Destino dos comprovativos: WhatsApp <strong>{proofPhone}</strong>
            </p>
            {item.payment_note ? <p className="rounded-2xl bg-sand-100/80 p-3">{item.payment_note}</p> : null}
            <FormActions>
              <Button type="button" disabled={confirming} onClick={confirmPayment}>
                {confirming ? 'A confirmar...' : 'Confirmar pagamento e reactivar'}
              </Button>
            </FormActions>
          </div>
        </Panel>
      ) : null}

      <Panel
        title={locked ? 'Desbloquear aplicação' : 'Bloquear aplicação'}
        description="Use em caso de falta de pagamento, fraude, abuso ou qualquer situação que ponha a app em risco."
        icon={locked ? UnlockKeyhole : LockKeyhole}
      >
        <div className="space-y-4">
          <TextArea
            label="Motivo do bloqueio"
            icon={FileText}
            value={blockFormReason}
            onChange={(e) => setBlockFormReason(e.target.value)}
            placeholder="Ex.: Pagamento da assinatura anual em atraso desde Novembro."
          />
          <FormActions>
            {locked ? (
              <Button type="button" disabled={locking} onClick={() => toggleBlock(false)}>
                {locking ? 'A desbloquear...' : 'Desbloquear app'}
              </Button>
            ) : (
              <Button type="button" variant="danger" disabled={locking} onClick={() => toggleBlock(true)}>
                {locking ? 'A bloquear...' : 'Bloquear app agora'}
              </Button>
            )}
          </FormActions>
        </div>
      </Panel>

      <Panel
        title="Contrato anual"
        description="O limite de pagamento (12 meses) é definido automaticamente pelo sistema."
        icon={BadgeDollarSign}
      >
        <div className="mb-5 rounded-2xl border border-brand-950/8 bg-sand-100/80 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-950 text-white">
              <CalendarRange size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-950">Período de pagamento (automático)</p>
              <p className="mt-1 text-sm text-ink-500">
                De <strong>{formatDate(item?.starts_at || period.starts_at)}</strong> até{' '}
                <strong>{formatDate(item?.ends_at || period.ends_at)}</strong> · ciclo de 12 meses
              </p>
              <p className="mt-2 text-xs text-ink-500">
                Não é necessário introduzir datas. Ao guardar sem período válido, ou ao renovar / desbloquear
                após pagamento, o sistema calcula o novo limite automaticamente.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button type="button" variant="secondary" disabled={renewing} onClick={renewAnnualCycle}>
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={16} />
                {renewing ? 'A renovar...' : 'Renovar ciclo anual (hoje + 12 meses)'}
              </span>
            </Button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome do plano"
            icon={CreditCard}
            value={form.plan_name}
            onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
            required
          />
          <Select
            label="Estado contratual"
            icon={Shield}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Input
            label="Valor da assinatura anual (AOA)"
            type="number"
            min="0"
            icon={BadgeDollarSign}
            value={form.annual_fee}
            onChange={(e) => setForm({ ...form, annual_fee: e.target.value })}
            required
          />
          <Input
            label="Máx. admins da loja"
            type="number"
            min="1"
            icon={Shield}
            value={form.max_admins}
            onChange={(e) => setForm({ ...form, max_admins: e.target.value })}
          />
          <Input
            label="Máx. quartos"
            type="number"
            min="1"
            icon={BedDouble}
            value={form.max_rooms}
            onChange={(e) => setForm({ ...form, max_rooms: e.target.value })}
          />
          <TextArea
            className="md:col-span-2"
            label="Notas internas"
            icon={FileText}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <FormActions className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar assinatura anual'}
            </Button>
          </FormActions>
        </form>
      </Panel>
    </div>
  )
}
