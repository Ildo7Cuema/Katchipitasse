/** GPO de recepção de pagamentos — platform (Super Admin) e store (Admin da loja). */

export const PAYMENT_GPO_SCOPES = {
  platform: 'platform',
  store: 'store',
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'multicaixa', label: 'Multicaixa Express / referência' },
  { value: 'online', label: 'Pagamento online (Gateway)' },
  { value: 'cash', label: 'Pagamento presencial' },
  { value: 'outro', label: 'Outro' },
]

export const GATEWAY_PROVIDER_OPTIONS = [
  { value: 'emis_gpo', label: 'EMIS / GPO' },
  { value: 'multicaixa_express', label: 'Multicaixa Express' },
  { value: 'proxypay', label: 'ProxyPay' },
  { value: 'appypay', label: 'AppyPay' },
  { value: 'paypay', label: 'PayPay' },
  { value: 'custom', label: 'Outro / personalizado' },
]

export const GATEWAY_ENVIRONMENT_OPTIONS = [
  { value: 'sandbox', label: 'Sandbox (testes)' },
  { value: 'production', label: 'Produção' },
]

export const EMPTY_PAYMENT_GPO = {
  scope: 'store',
  enabled: false,
  proof_phone: '',
  proof_whatsapp: '',
  account_name: '',
  bank_name: '',
  iban: '',
  multicaixa_entity: '',
  multicaixa_reference: '',
  methods: ['transferencia', 'multicaixa', 'cash'],
  instructions: '',
  gateway_enabled: false,
  gateway_provider: 'emis_gpo',
  gateway_environment: 'sandbox',
  gateway_merchant_id: '',
  gateway_terminal_id: '',
  gateway_entity_id: '',
  gateway_api_key: '',
  gateway_api_secret: '',
  gateway_webhook_secret: '',
  gateway_base_url: '',
  gateway_callback_url: '',
  gateway_notes: '',
  gateway_configured: false,
  gateway_api_key_set: false,
  gateway_api_secret_set: false,
  gateway_webhook_secret_set: false,
}

export function normalizePhoneDigits(value = '') {
  return String(value || '').replace(/\D/g, '')
}

/** Converte telefone Angola para wa.me (244…). */
export function toWhatsAppDigits(phoneOrWhatsapp = '') {
  const digits = normalizePhoneDigits(phoneOrWhatsapp)
  if (!digits) return ''
  if (digits.startsWith('244')) return digits
  if (digits.length === 9) return `244${digits}`
  return digits
}

export function displayProofPhone(gpo) {
  const phone = normalizePhoneDigits(gpo?.proof_phone)
  if (phone) return phone
  const wa = normalizePhoneDigits(gpo?.proof_whatsapp)
  if (wa.startsWith('244') && wa.length > 3) return wa.slice(3)
  return wa || ''
}

function normalizeMethods(raw) {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(String) : EMPTY_PAYMENT_GPO.methods
    } catch {
      return EMPTY_PAYMENT_GPO.methods
    }
  }
  return EMPTY_PAYMENT_GPO.methods
}

export function gatewayProviderLabel(value) {
  return GATEWAY_PROVIDER_OPTIONS.find((p) => p.value === value)?.label || value || '—'
}

export function isGatewayReady(gpo) {
  if (!gpo?.gateway_enabled) return false
  if (gpo.gateway_configured === true) return true
  const keySet = Boolean(gpo.gateway_api_key_set) || Boolean(String(gpo.gateway_api_key || '').trim())
  const merchant = String(gpo.gateway_merchant_id || gpo.gateway_entity_id || '').trim()
  return Boolean(keySet && merchant)
}

export function normalizePaymentGpo(row, scope = 'store') {
  const methods = normalizeMethods(row?.methods)
  const normalized = {
    ...EMPTY_PAYMENT_GPO,
    ...row,
    scope: row?.scope || scope,
    enabled: Boolean(row?.enabled),
    proof_phone: row?.proof_phone || '',
    proof_whatsapp: row?.proof_whatsapp || '',
    account_name: row?.account_name || '',
    bank_name: row?.bank_name || '',
    iban: row?.iban || '',
    multicaixa_entity: row?.multicaixa_entity || '',
    multicaixa_reference: row?.multicaixa_reference || '',
    methods: methods.length ? methods : EMPTY_PAYMENT_GPO.methods,
    instructions: row?.instructions || '',
    gateway_enabled: Boolean(row?.gateway_enabled),
    gateway_provider: row?.gateway_provider || 'emis_gpo',
    gateway_environment: row?.gateway_environment || 'sandbox',
    gateway_merchant_id: row?.gateway_merchant_id || '',
    gateway_terminal_id: row?.gateway_terminal_id || '',
    gateway_entity_id: row?.gateway_entity_id || '',
    gateway_api_key: '',
    gateway_api_secret: '',
    gateway_webhook_secret: '',
    gateway_base_url: row?.gateway_base_url || '',
    gateway_callback_url: row?.gateway_callback_url || '',
    gateway_notes: row?.gateway_notes || '',
    gateway_api_key_set: Boolean(row?.gateway_api_key_set) || Boolean(String(row?.gateway_api_key || '').trim()),
    gateway_api_secret_set: Boolean(row?.gateway_api_secret_set) || Boolean(String(row?.gateway_api_secret || '').trim()),
    gateway_webhook_secret_set:
      Boolean(row?.gateway_webhook_secret_set) || Boolean(String(row?.gateway_webhook_secret || '').trim()),
  }
  return {
    ...normalized,
    gateway_configured: Boolean(row?.gateway_configured) || isGatewayReady(normalized),
  }
}

export function paymentGpoFormToRpcPayload(form) {
  const payload = paymentGpoToPayload(form, form.scope || 'store')
  // Não enviar strings vazias de segredos — o RPC preserva os valores já guardados
  if (!String(form.gateway_api_key || '').trim()) delete payload.gateway_api_key
  if (!String(form.gateway_api_secret || '').trim()) delete payload.gateway_api_secret
  if (!String(form.gateway_webhook_secret || '').trim()) delete payload.gateway_webhook_secret
  return payload
}

export function paymentGpoToPayload(form, scope) {
  const proofPhone = normalizePhoneDigits(form.proof_phone)
  const whatsapp =
    toWhatsAppDigits(form.proof_whatsapp || form.proof_phone) || (proofPhone ? toWhatsAppDigits(proofPhone) : null)

  let methods = Array.isArray(form.methods) && form.methods.length ? [...form.methods] : [...EMPTY_PAYMENT_GPO.methods]
  if (form.gateway_enabled && !methods.includes('online')) methods.push('online')
  if (!form.gateway_enabled) methods = methods.filter((m) => m !== 'online')

  return {
    scope,
    enabled: Boolean(form.enabled),
    proof_phone: proofPhone || null,
    proof_whatsapp: whatsapp,
    account_name: form.account_name?.trim() || null,
    bank_name: form.bank_name?.trim() || null,
    iban: form.iban?.trim() || null,
    multicaixa_entity: form.multicaixa_entity?.trim() || null,
    multicaixa_reference: form.multicaixa_reference?.trim() || null,
    methods,
    instructions: form.instructions?.trim() || null,
    gateway_enabled: Boolean(form.gateway_enabled),
    gateway_provider: form.gateway_enabled ? form.gateway_provider || 'custom' : null,
    gateway_environment: form.gateway_environment === 'production' ? 'production' : 'sandbox',
    gateway_merchant_id: form.gateway_merchant_id?.trim() || null,
    gateway_terminal_id: form.gateway_terminal_id?.trim() || null,
    gateway_entity_id: form.gateway_entity_id?.trim() || null,
    gateway_api_key: form.gateway_api_key?.trim() || null,
    gateway_api_secret: form.gateway_api_secret?.trim() || null,
    gateway_webhook_secret: form.gateway_webhook_secret?.trim() || null,
    gateway_base_url: form.gateway_base_url?.trim() || null,
    gateway_callback_url: form.gateway_callback_url?.trim() || null,
    gateway_notes: form.gateway_notes?.trim() || null,
  }
}

export function methodLabel(value) {
  return PAYMENT_METHOD_OPTIONS.find((m) => m.value === value)?.label || value
}

export function buildProofWhatsAppUrl(gpo, { title, lines = [] } = {}) {
  const wa = toWhatsAppDigits(gpo?.proof_whatsapp || gpo?.proof_phone)
  if (!wa) return null
  const body = [title, ...lines.filter(Boolean), '', 'Segue o comprovativo em anexo / mensagem.'].filter(
    (line) => line !== null && line !== undefined,
  )
  return `https://wa.me/${wa}?text=${encodeURIComponent(body.join('\n'))}`
}

export function buildSubscriptionProofWhatsAppUrl(gpo, { companyName = '', feeLabel = '', method = '', note = '' } = {}) {
  return buildProofWhatsAppUrl(gpo, {
    title: 'Comprovativo de pagamento — Assinatura anual Katchipitasse Elavoko',
    lines: [
      companyName ? `Loja: ${companyName}` : null,
      feeLabel ? `Valor: ${feeLabel}` : null,
      method ? `Método: ${methodLabel(method)}` : null,
      note ? `Notas: ${note}` : null,
    ],
  })
}

export function buildClientProofWhatsAppUrl(gpo, { subject = '', amountLabel = '', method = '', note = '' } = {}) {
  return buildProofWhatsAppUrl(gpo, {
    title: subject || 'Comprovativo de pagamento — Katchipitasse Elavoko',
    lines: [
      amountLabel ? `Valor: ${amountLabel}` : null,
      method ? `Método: ${methodLabel(method)}` : null,
      note ? `Notas: ${note}` : null,
    ],
  })
}
