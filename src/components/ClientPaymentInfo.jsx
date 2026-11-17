import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Globe, MessageCircle, Phone, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  buildClientProofWhatsAppUrl,
  displayProofPhone,
  gatewayProviderLabel,
  isGatewayReady,
  methodLabel,
  normalizePaymentGpo,
} from '@/lib/paymentGpo'
import { getPaymentGpoSafe } from '@/services/api'

export default function ClientPaymentInfo({
  subject = 'Comprovativo de pagamento — Katchipitasse Elavoko',
  amountLabel = '',
  fallbackLabel = 'Pagamento acordado directamente com a empresa',
}) {
  const [gpo, setGpo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getPaymentGpoSafe('store')
        if (mounted) setGpo(normalizePaymentGpo(data, 'store'))
      } catch {
        if (mounted) setGpo(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const phone = displayProofPhone(gpo)
  const gatewayReady = isGatewayReady(gpo)
  const whatsappUrl = useMemo(
    () =>
      gpo?.enabled
        ? buildClientProofWhatsAppUrl(gpo, {
            subject,
            amountLabel,
          })
        : null,
    [gpo, subject, amountLabel],
  )

  if (loading) return null

  if (!gpo?.enabled) {
    return (
      <span className="inline-flex rounded-full bg-brand-700/10 px-2.5 py-1 text-xs font-semibold text-brand-800">
        {fallbackLabel}
      </span>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-brand-950/8 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-600">
          <WalletCards size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-brand-950">Como pagar</p>
          <p className="mt-1 text-sm text-ink-500">
            A loja activou a GPO de pagamentos
            {gatewayReady ? ' com gateway online do banco' : ''}.
          </p>
        </div>
      </div>

      {gatewayReady ? (
        <div className="rounded-2xl bg-sand-100/80 p-3 text-sm text-ink-700">
          <p className="flex items-center gap-2 font-medium text-brand-950">
            <Globe size={14} className="text-clay-600" /> Pagamento online disponível
          </p>
          <p className="mt-1">
            Gateway: <strong>{gatewayProviderLabel(gpo.gateway_provider)}</strong>
            {gpo.gateway_environment === 'sandbox' ? ' · ambiente de testes' : ''}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            O checkout online usa as credenciais da loja (nunca as da plataforma).
          </p>
        </div>
      ) : null}

      <ul className="space-y-1.5 text-sm text-ink-700">
        {phone ? (
          <li className="flex items-center gap-2">
            <Phone size={14} className="text-clay-600" /> WhatsApp / telefone: <strong>{phone}</strong>
          </li>
        ) : null}
        {gpo.account_name ? (
          <li>
            Titular: <strong>{gpo.account_name}</strong>
          </li>
        ) : null}
        {gpo.bank_name ? (
          <li>
            Banco: <strong>{gpo.bank_name}</strong>
          </li>
        ) : null}
        {gpo.iban ? (
          <li className="flex items-start gap-2">
            <CreditCard size={14} className="mt-0.5 text-clay-600" /> IBAN / conta: <strong>{gpo.iban}</strong>
          </li>
        ) : null}
        {gpo.multicaixa_entity ? (
          <li>
            Entidade Multicaixa: <strong>{gpo.multicaixa_entity}</strong>
            {gpo.multicaixa_reference ? ` · Ref. ${gpo.multicaixa_reference}` : ''}
          </li>
        ) : null}
        {(gpo.methods || []).length ? (
          <li>
            Métodos: <strong>{(gpo.methods || []).map(methodLabel).join(', ')}</strong>
          </li>
        ) : null}
      </ul>

      {gpo.instructions ? <p className="text-sm text-ink-500">{gpo.instructions}</p> : null}

      {whatsappUrl ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
        >
          <MessageCircle size={16} /> Enviar comprovativo
          {phone ? ` para ${phone}` : ''}
        </Button>
      ) : null}
    </div>
  )
}
