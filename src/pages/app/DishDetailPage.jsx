import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import ClientPaymentInfo from '@/components/ClientPaymentInfo'
import { Button, CardMedia, Input, Spinner, TextArea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { buildShareUrl, shareContent } from '@/lib/share'
import { createOrder, getDish } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { settings } = useCompany()
  const toast = useToast()

  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getDish(id)
        if (mounted) setDish(data)
      } catch (err) {
        toast.error(err.message || 'Prato não encontrado')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, toast])

  useEffect(() => {
    if (profile) {
      setCustomerName(profile.full_name || '')
      setCustomerPhone(profile.phone || '')
    }
  }, [profile])

  async function handleShare() {
    const result = await shareContent({
      title: `${dish.name} — ${settings.company_name}`,
      text: `${dish.description || ''} · ${formatCurrency(dish.price)}`,
      url: buildShareUrl(`/restaurante/${dish.id}`),
    })
    if (result.fallback === 'clipboard') toast.success('Ligação copiada')
    else if (result.ok) toast.success('Partilha iniciada')
  }

  async function handleOrder(e) {
    e.preventDefault()
    if (!user) {
      navigate('/entrar', { state: { from: `/restaurante/${id}` } })
      return
    }
    if (!isSupabaseConfigured) {
      toast.error('Configure o Supabase para enviar pedidos reais.')
      return
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Indique o nome e o telefone.')
      return
    }

    setSubmitting(true)
    try {
      await createOrder({
        userId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes,
        items: [
          {
            dish_id: dish.id,
            dish_name: dish.name,
            unit_price: dish.price,
            quantity: Number(quantity),
          },
        ],
      })
      toast.success('Solicitação enviada. Aguardamos confirmação.')
      navigate('/perfil/pedidos')
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!dish) {
    return (
      <div className="text-center">
        <p>Prato não encontrado.</p>
        <Link to="/restaurante" className="mt-3 inline-block text-brand-700">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-[2rem]">
        <CardMedia src={dish.image_url} alt={dish.name} className="h-72" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/55 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-500">Restaurante</p>
            <h1 className="font-display text-3xl">{dish.name}</h1>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(dish.price)}</p>
          </div>
          <Button variant="light" onClick={handleShare} aria-label="Partilhar prato">
            <Share2 size={16} />
          </Button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-700">{dish.description}</p>
      <ClientPaymentInfo
        subject={`Comprovativo — pedido: ${dish.name}`}
        amountLabel={formatCurrency(dish.price)}
      />

      <form onSubmit={handleOrder} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-950/5">
        <h2 className="font-display text-lg text-brand-900">Solicitar refeição</h2>
        <Input
          label="Quantidade"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <Input
          label="Nome completo"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
        <Input
          label="Telefone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          required
        />
        <TextArea
          label="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: sem picante, entregar às 19h..."
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'A enviar...' : user ? 'Enviar solicitação' : 'Entrar para solicitar'}
        </Button>
      </form>
    </div>
  )
}
