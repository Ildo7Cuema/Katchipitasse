import { useEffect, useState } from 'react'
import { WalletCards } from 'lucide-react'
import { AdminHero } from '@/components/AdminUI'
import PaymentGpoForm from '@/components/PaymentGpoForm'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { EMPTY_PAYMENT_GPO, normalizePaymentGpo } from '@/lib/paymentGpo'
import { getPaymentGpo, savePaymentGpo } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function PaymentGpoAdminPage() {
  const toast = useToast()
  const { isSuperAdmin } = useAuth()
  const scope = isSuperAdmin ? 'platform' : 'store'
  const [form, setForm] = useState({ ...EMPTY_PAYMENT_GPO, scope })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getPaymentGpo(scope, { includeSecrets: true })
        if (mounted) setForm(normalizePaymentGpo(data, scope))
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar GPO. Execute as migrations 007 e 008.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [scope, toast])

  async function onSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) return toast.error('Configure o Supabase')
    if (form.enabled && !form.gateway_enabled && !String(form.proof_phone || '').replace(/\D/g, '')) {
      return toast.error('Indique o telefone/WhatsApp ou active o gateway online.')
    }
    if (form.gateway_enabled) {
      if (!String(form.gateway_merchant_id || form.gateway_entity_id || '').trim()) {
        return toast.error('Indique o Merchant ID ou Entity ID fornecidos pelo banco.')
      }
      if (!String(form.gateway_api_key || '').trim() && !form.gateway_api_key_set) {
        return toast.error('Indique a API Key / Token do gateway.')
      }
    }
    setSaving(true)
    try {
      const data = await savePaymentGpo(scope, form)
      setForm(data)
      toast.success(
        isSuperAdmin
          ? 'GPO e gateway da app guardados (exclusivo Super Admin)'
          : 'GPO e gateway dos clientes guardados (exclusivo Admin da loja)',
      )
    } catch (err) {
      toast.error(err.message || 'Erro ao guardar. Execute as migrations 007 e 008.')
    } finally {
      setSaving(false)
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
        tone="dark"
        eyebrow="GPO"
        title={isSuperAdmin ? 'Pagamentos da plataforma' : 'Pagamentos dos clientes'}
        description={
          isSuperAdmin
            ? 'Comprovativos e gateway online exclusivos para o pagamento da assinatura da app.'
            : 'Comprovativos e gateway online exclusivos para receber pagamentos dos clientes.'
        }
        icon={WalletCards}
      />

      <PaymentGpoForm
        title={isSuperAdmin ? 'GPO — assinatura da app' : 'GPO — clientes da loja'}
        description={
          isSuperAdmin
            ? 'Dados manuais (WhatsApp/IBAN) e métodos para renovação da aplicação.'
            : 'Dados manuais e métodos mostrados aos clientes quando a GPO estiver activa.'
        }
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={onSubmit}
        enableLabel={
          isSuperAdmin
            ? 'Activar recepção de comprovativos da assinatura'
            : 'Quero receber pagamentos dos meus clientes'
        }
        enableHelper={
          isSuperAdmin
            ? 'Usado pelo admin da loja na página de assinatura anual.'
            : 'Quando activa, pratos e quartos mostram como pagar.'
        }
        gatewayTitle={
          isSuperAdmin ? 'Gateway online — pagamento da app' : 'Gateway online — pagamento dos clientes'
        }
        gatewayDescription={
          isSuperAdmin
            ? 'Credenciais do banco só para cobrança da assinatura anual. Não servem para clientes da loja.'
            : 'Credenciais do banco só para cobrança a clientes. Independentes do gateway do Super Admin.'
        }
        gatewayEnableLabel={
          isSuperAdmin
            ? 'Activar gateway online para a assinatura da app'
            : 'Activar gateway online para os clientes'
        }
      />
    </div>
  )
}
