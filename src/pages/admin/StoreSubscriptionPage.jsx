import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeDollarSign,
  CalendarRange,
  CreditCard,
  FileText,
  MessageCircle,
  Phone,
  ShieldAlert,
} from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import { Button, Select, Spinner, TextArea } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'
import { usePlatformAccess } from '@/contexts/PlatformAccessContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  buildSubscriptionProofWhatsAppUrl,
  displayProofPhone,
  gatewayProviderLabel,
  isGatewayReady,
  methodLabel,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/paymentGpo'
import { SUBSCRIPTION_PROOF_PHONE } from '@/lib/subscriptionBilling'
import { isPeriodExpired } from '@/lib/subscriptionPeriod'
import { getPaymentGpoSafe, getSubscription, requestSubscriptionPayment } from '@/services/api'

const statusLabel = {
  trial: 'Período experimental',
  active: 'Activa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

function openProofWhatsApp(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function StoreSubscriptionPage() {
  const toast = useToast()
  const { settings } = useCompany()
  const { isAppBlocked, blockReason, lockStatus, refresh } = usePlatformAccess()
  const [item, setItem] = useState(null)
  const [platformGpo, setPlatformGpo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [method, setMethod] = useState('transferencia')

  async function load() {
    const [sub, gpo] = await Promise.all([getSubscription(), getPaymentGpoSafe('platform')])
    setItem(sub)
    setPlatformGpo(gpo)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar assinatura')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  const expired = isPeriodExpired(item?.ends_at)
  const needsPayment =
    Boolean(item?.is_blocked) ||
    isAppBlocked ||
    expired ||
    ['suspended', 'expired', 'cancelled'].includes(item?.status)
  const pendingRequest = Boolean(item?.payment_requested_at)
  const fee = item?.annual_fee ?? item?.monthly_fee ?? 0
  const proofPhone = displayProofPhone(platformGpo) || SUBSCRIPTION_PROOF_PHONE
  const allowedMethods = useMemo(() => {
    const selected = Array.isArray(platformGpo?.methods) ? platformGpo.methods : []
    const filtered = PAYMENT_METHOD_OPTIONS.filter((m) => selected.includes(m.value))
    return filtered.length ? filtered : PAYMENT_METHOD_OPTIONS
  }, [platformGpo])

  useEffect(() => {
    if (!allowedMethods.some((m) => m.value === method)) {
      setMethod(allowedMethods[0]?.value || 'transferencia')
    }
  }, [allowedMethods, method])

  const proofWhatsAppUrl = useMemo(
    () =>
      buildSubscriptionProofWhatsAppUrl(platformGpo || { proof_phone: proofPhone }, {
        companyName: settings?.company_name || '',
        feeLabel: formatCurrency(fee),
        method,
        note: note.trim(),
      }),
    [platformGpo, proofPhone, settings?.company_name, fee, method, note],
  )

  async function onRequestPayment(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await requestSubscriptionPayment({
        note:
          note.trim() ||
          `Pagamento da assinatura anual (${formatCurrency(fee)}). Comprovativo enviado para ${proofPhone}.`,
        method,
      })
      await load()
      await refresh()
      toast.success(`Pedido registado. Envie o comprovativo para ${proofPhone}.`)
      openProofWhatsApp(proofWhatsAppUrl)
    } catch (err) {
      toast.error(err.message || 'Não foi possível registar o pedido. Execute a migration 006.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone={needsPayment ? 'accent' : 'dark'}
        eyebrow="Assinatura da loja"
        title="Assinatura anual"
        description="Consulte o estado do contrato e regularize o pagamento para manter a aplicação activa."
        icon={CreditCard}
      />

      <div
        className={`rounded-3xl px-5 py-4 text-sm ${
          needsPayment
            ? 'border border-clay-500/30 bg-clay-500/10 text-brand-950'
            : 'border border-brand-950/8 bg-white text-brand-950'
        }`}
      >
        <p>
          Estado:{' '}
          <strong>{statusLabel[item?.status] || item?.status || '—'}</strong>
          {item?.ends_at ? ` · válido até ${formatDate(item.ends_at)}` : null}
          {` · ${formatCurrency(fee)} / ano`}
        </p>
        {needsPayment ? (
          <p className="mt-2 font-medium text-clay-700">
            {blockReason ||
              lockStatus?.block_reason ||
              (expired
                ? 'A assinatura anual expirou. Efectue o pagamento para reactivar a app.'
                : 'É necessário regularizar a assinatura para continuar a operar.')}
          </p>
        ) : (
          <p className="mt-2 text-ink-500">Assinatura em dia. A loja está operacional.</p>
        )}
      </div>

      <Panel title="Detalhes do contrato" description="Plano anual único da aplicação." icon={BadgeDollarSign}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Plano</p>
            <p className="mt-1 font-display text-2xl text-brand-950">{item?.plan_name || 'Anual'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Valor anual</p>
            <p className="mt-1 text-lg font-semibold text-brand-950">{formatCurrency(fee)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Início</p>
            <p className="mt-1 text-lg font-semibold text-brand-950">{formatDate(item?.starts_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Fim</p>
            <p className="mt-1 text-lg font-semibold text-brand-950">{formatDate(item?.ends_at)}</p>
          </div>
        </div>
      </Panel>

      {needsPayment ? (
        <Panel
          title="Pagar e reactivar"
          description={`Envie o comprovativo para WhatsApp ${proofPhone} e solicite a activação.`}
          icon={ShieldAlert}
        >
          <div className="mb-4 space-y-3 rounded-2xl border border-brand-950/8 bg-sand-100/80 p-4 text-sm text-ink-700">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 shrink-0 text-clay-600" size={18} />
              <div>
                <p className="font-medium text-brand-950">Destino do comprovativo (GPO plataforma)</p>
                <p className="mt-1">
                  Comprovativos de assinatura → WhatsApp <strong>{proofPhone}</strong>.
                </p>
              </div>
            </div>
            {platformGpo?.account_name || platformGpo?.iban || platformGpo?.bank_name ? (
              <ul className="space-y-1 pl-8">
                {platformGpo.account_name ? (
                  <li>
                    Titular: <strong>{platformGpo.account_name}</strong>
                  </li>
                ) : null}
                {platformGpo.bank_name ? (
                  <li>
                    Banco: <strong>{platformGpo.bank_name}</strong>
                  </li>
                ) : null}
                {platformGpo.iban ? (
                  <li>
                    IBAN / conta: <strong>{platformGpo.iban}</strong>
                  </li>
                ) : null}
                {platformGpo.multicaixa_entity ? (
                  <li>
                    Multicaixa: <strong>{platformGpo.multicaixa_entity}</strong>
                    {platformGpo.multicaixa_reference ? ` · ${platformGpo.multicaixa_reference}` : ''}
                  </li>
                ) : null}
              </ul>
            ) : null}
            {isGatewayReady(platformGpo) ? (
              <p className="pl-8 text-sm text-ink-700">
                Gateway online da app activo:{' '}
                <strong>{gatewayProviderLabel(platformGpo.gateway_provider)}</strong>
                {platformGpo.gateway_environment === 'sandbox' ? ' (sandbox)' : ''}. Exclusivo para a
                assinatura — não usa o gateway da loja.
              </p>
            ) : null}
            {platformGpo?.instructions ? <p className="pl-8 text-ink-500">{platformGpo.instructions}</p> : null}
          </div>

          {pendingRequest ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-sand-100/80 p-4 text-sm text-ink-700">
                <p className="font-medium text-brand-950">Pedido já registado</p>
                <p className="mt-1">
                  Em {formatDate(item.payment_requested_at)}
                  {item.payment_method ? ` · ${methodLabel(item.payment_method)}` : ''}
                </p>
                {item.payment_note ? <p className="mt-2 text-ink-500">{item.payment_note}</p> : null}
                <p className="mt-3">
                  Confirme que enviou o comprovativo para <strong>{proofPhone}</strong>. O Super Admin valida e
                  reactiva a app.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => openProofWhatsApp(proofWhatsAppUrl)}>
                <MessageCircle size={16} /> Enviar comprovativo para {proofPhone}
              </Button>
            </div>
          ) : (
            <form onSubmit={onRequestPayment} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-2xl border border-brand-950/8 bg-sand-100/70 p-4 text-sm text-ink-700">
                <p className="flex items-center gap-2 font-medium text-brand-950">
                  <CalendarRange size={16} /> Valor a pagar
                </p>
                <p className="mt-2 font-display text-3xl text-clay-600">{formatCurrency(fee)}</p>
                <p className="mt-2 text-xs text-ink-500">
                  Ciclo anual de 12 meses após confirmação. Comprovativo → WhatsApp {proofPhone}.
                </p>
              </div>

              <Select
                label="Método de pagamento"
                icon={CreditCard}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {allowedMethods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>

              <TextArea
                className="md:col-span-2"
                label="Notas do comprovativo"
                icon={FileText}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex.: Transferência feita em 17/11/2026, referência 12345."
              />

              <FormActions className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'A enviar...' : `Já paguei — enviar para ${proofPhone}`}
                </Button>
                <Button type="button" variant="secondary" onClick={() => openProofWhatsApp(proofWhatsAppUrl)}>
                  <MessageCircle size={16} /> Abrir WhatsApp {proofPhone}
                </Button>
                <Link to="/admin">
                  <Button type="button" variant="outline">
                    Voltar
                  </Button>
                </Link>
              </FormActions>
            </form>
          )}
        </Panel>
      ) : (
        <Panel title="Tudo certo" description="Não é necessário pagamento neste momento." icon={BadgeDollarSign}>
          <Link to="/admin">
            <Button>Ir para o painel da loja</Button>
          </Link>
        </Panel>
      )}
    </div>
  )
}
