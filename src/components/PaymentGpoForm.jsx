import { Building2, CreditCard, FileText, KeyRound, Phone, Shield, WalletCards } from 'lucide-react'
import { FormActions, Panel } from '@/components/AdminUI'
import { Button, Input, Select, TextArea } from '@/components/ui'
import {
  GATEWAY_ENVIRONMENT_OPTIONS,
  GATEWAY_PROVIDER_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/paymentGpo'

export default function PaymentGpoForm({
  title,
  description,
  form,
  setForm,
  saving,
  onSubmit,
  enableLabel = 'Activar recepção de pagamentos',
  enableHelper = '',
  gatewayTitle = 'Gateway de pagamento online',
  gatewayDescription = 'Credenciais fornecidas pelo banco. Mantidas privadas neste âmbito.',
  gatewayEnableLabel = 'Activar pagamento online via gateway',
}) {
  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function toggleMethod(value) {
    setForm((prev) => {
      const current = Array.isArray(prev.methods) ? prev.methods : []
      const next = current.includes(value) ? current.filter((m) => m !== value) : [...current, value]
      return { ...prev, methods: next.length ? next : current }
    })
  }

  return (
    <div className="space-y-6">
      <Panel title={title} description={description} icon={WalletCards}>
        <form id="payment-gpo-form" onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-950/8 bg-sand-100/80 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-brand-950/20 text-clay-600 focus:ring-clay-500"
              checked={Boolean(form.enabled)}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-medium text-brand-950">{enableLabel}</span>
              {enableHelper ? <span className="mt-1 block text-xs text-ink-500">{enableHelper}</span> : null}
            </span>
          </label>

          <Input
            label="Telefone / WhatsApp dos comprovativos"
            icon={Phone}
            value={form.proof_phone || ''}
            onChange={update('proof_phone')}
            placeholder="921923232"
            required={Boolean(form.enabled) && !form.gateway_enabled}
          />
          <Input
            label="WhatsApp (com indicativo, opcional)"
            icon={Phone}
            value={form.proof_whatsapp || ''}
            onChange={update('proof_whatsapp')}
            placeholder="244921923232"
          />
          <Input
            label="Titular da conta"
            icon={Building2}
            value={form.account_name || ''}
            onChange={update('account_name')}
          />
          <Input label="Banco" icon={Building2} value={form.bank_name || ''} onChange={update('bank_name')} />
          <Input label="IBAN / Nº de conta" icon={CreditCard} value={form.iban || ''} onChange={update('iban')} />
          <Input
            label="Entidade Multicaixa"
            icon={CreditCard}
            value={form.multicaixa_entity || ''}
            onChange={update('multicaixa_entity')}
          />
          <Input
            label="Referência Multicaixa"
            icon={CreditCard}
            value={form.multicaixa_reference || ''}
            onChange={update('multicaixa_reference')}
            className="md:col-span-2"
          />

          <fieldset className="md:col-span-2 space-y-2">
            <legend className="text-sm font-medium text-ink-700">Métodos aceites</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-2xl border border-brand-950/8 bg-white px-3 py-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-brand-950/20 text-clay-600 focus:ring-clay-500"
                    checked={(form.methods || []).includes(opt.value)}
                    onChange={() => toggleMethod(opt.value)}
                    disabled={opt.value === 'online' && form.gateway_enabled}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <TextArea
            className="md:col-span-2"
            label="Instruções para quem paga"
            icon={FileText}
            value={form.instructions || ''}
            onChange={update('instructions')}
            placeholder="Ex.: Envie o comprovativo com o nome da reserva / pedido."
          />
        </form>
      </Panel>

      <Panel title={gatewayTitle} description={gatewayDescription} icon={KeyRound}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-950/8 bg-sand-100/80 p-4">
            <input
              type="checkbox"
              form="payment-gpo-form"
              className="mt-1 h-4 w-4 rounded border-brand-950/20 text-clay-600 focus:ring-clay-500"
              checked={Boolean(form.gateway_enabled)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gateway_enabled: e.target.checked,
                  methods: e.target.checked
                    ? Array.from(new Set([...(prev.methods || []), 'online']))
                    : (prev.methods || []).filter((m) => m !== 'online'),
                }))
              }
            />
            <span>
              <span className="block text-sm font-medium text-brand-950">{gatewayEnableLabel}</span>
              <span className="mt-1 block text-xs text-ink-500">
                Insira as credenciais que o banco / processador lhe enviou. Os segredos não são mostrados aos
                clientes.
              </span>
            </span>
          </label>

          <Select
            label="Fornecedor / gateway"
            icon={Shield}
            form="payment-gpo-form"
            value={form.gateway_provider || 'emis_gpo'}
            onChange={update('gateway_provider')}
            disabled={!form.gateway_enabled}
          >
            {GATEWAY_PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Ambiente"
            icon={Shield}
            form="payment-gpo-form"
            value={form.gateway_environment || 'sandbox'}
            onChange={update('gateway_environment')}
            disabled={!form.gateway_enabled}
          >
            {GATEWAY_ENVIRONMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Input
            label="Merchant ID / ID do comerciante"
            icon={KeyRound}
            form="payment-gpo-form"
            value={form.gateway_merchant_id || ''}
            onChange={update('gateway_merchant_id')}
            disabled={!form.gateway_enabled}
            required={Boolean(form.gateway_enabled)}
            placeholder="Fornecido pelo banco"
          />
          <Input
            label="Entity ID / Entidade"
            icon={KeyRound}
            form="payment-gpo-form"
            value={form.gateway_entity_id || ''}
            onChange={update('gateway_entity_id')}
            disabled={!form.gateway_enabled}
            placeholder="Opcional — se o banco fornecer"
          />
          <Input
            label="Terminal ID"
            icon={KeyRound}
            form="payment-gpo-form"
            value={form.gateway_terminal_id || ''}
            onChange={update('gateway_terminal_id')}
            disabled={!form.gateway_enabled}
          />
          <Input
            label={
              form.gateway_api_key_set
                ? 'API Key / Token (já guardada — deixe em branco para manter)'
                : 'API Key / Token'
            }
            icon={KeyRound}
            form="payment-gpo-form"
            type="password"
            autoComplete="new-password"
            value={form.gateway_api_key || ''}
            onChange={update('gateway_api_key')}
            disabled={!form.gateway_enabled}
            required={Boolean(form.gateway_enabled) && !form.gateway_api_key_set}
            placeholder={form.gateway_api_key_set ? '•••• guardada' : 'Fornecida pelo banco'}
          />
          <Input
            label={
              form.gateway_api_secret_set
                ? 'API Secret (já guardado — deixe em branco para manter)'
                : 'API Secret / Client Secret'
            }
            icon={KeyRound}
            form="payment-gpo-form"
            type="password"
            autoComplete="new-password"
            value={form.gateway_api_secret || ''}
            onChange={update('gateway_api_secret')}
            disabled={!form.gateway_enabled}
            placeholder={form.gateway_api_secret_set ? '•••• guardado' : 'Fornecido pelo banco'}
          />
          <Input
            label={
              form.gateway_webhook_secret_set
                ? 'Webhook Secret (já guardado — deixe em branco para manter)'
                : 'Webhook / Callback Secret'
            }
            icon={KeyRound}
            form="payment-gpo-form"
            type="password"
            autoComplete="new-password"
            value={form.gateway_webhook_secret || ''}
            onChange={update('gateway_webhook_secret')}
            disabled={!form.gateway_enabled}
            placeholder={form.gateway_webhook_secret_set ? '•••• guardado' : 'Opcional'}
          />
          <Input
            label="URL base da API (opcional)"
            icon={CreditCard}
            form="payment-gpo-form"
            value={form.gateway_base_url || ''}
            onChange={update('gateway_base_url')}
            disabled={!form.gateway_enabled}
            placeholder="https://..."
          />
          <Input
            label="URL de callback (opcional)"
            icon={CreditCard}
            form="payment-gpo-form"
            value={form.gateway_callback_url || ''}
            onChange={update('gateway_callback_url')}
            disabled={!form.gateway_enabled}
            placeholder="https://..."
          />
          <TextArea
            className="md:col-span-2"
            label="Notas internas do gateway"
            icon={FileText}
            form="payment-gpo-form"
            value={form.gateway_notes || ''}
            onChange={update('gateway_notes')}
            disabled={!form.gateway_enabled}
            placeholder="Ex.: credenciais enviadas pelo BAI em 17/11/2026."
          />
        </div>

        <FormActions className="mt-4">
          <Button type="submit" form="payment-gpo-form" disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar GPO e gateway'}
          </Button>
        </FormActions>
      </Panel>
    </div>
  )
}
