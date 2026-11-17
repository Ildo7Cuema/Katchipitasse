import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Share2, Users } from 'lucide-react'
import ClientPaymentInfo from '@/components/ClientPaymentInfo'
import { Badge, Button, CardMedia, Input, Spinner, TextArea } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { buildShareUrl, shareContent } from '@/lib/share'
import { isSupabaseConfigured } from '@/lib/supabase'
import { checkRoomAvailability, createReservation, getRoom } from '@/services/api'

export default function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { settings } = useCompany()
  const toast = useToast()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [availability, setAvailability] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getRoom(id)
        if (mounted) setRoom(data)
      } catch (err) {
        toast.error(err.message || 'Quarto não encontrado')
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!checkIn || !checkOut || !room) {
        setAvailability(null)
        return
      }
      if (new Date(checkOut) <= new Date(checkIn)) {
        setAvailability(false)
        return
      }
      try {
        const ok = await checkRoomAvailability(room.id, checkIn, checkOut)
        if (mounted) setAvailability(ok)
      } catch {
        if (mounted) setAvailability(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [checkIn, checkOut, room])

  async function handleShare() {
    const result = await shareContent({
      title: `${room.name} — ${settings.company_name}`,
      text: `${room.description || ''} · ${formatCurrency(room.price_per_night)}/noite`,
      url: buildShareUrl(`/hospedaria/${room.id}`),
    })
    if (result.fallback === 'clipboard') toast.success('Ligação copiada')
    else if (result.ok) toast.success('Partilha iniciada')
  }

  async function handleReserve(e) {
    e.preventDefault()
    if (!user) {
      navigate('/entrar', { state: { from: `/hospedaria/${id}` } })
      return
    }
    if (!isSupabaseConfigured) {
      toast.error('Configure o Supabase para enviar reservas reais.')
      return
    }
    if (Number(guests) > room.max_guests) {
      toast.error(`Capacidade máxima: ${room.max_guests} hóspedes.`)
      return
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error('A data de saída deve ser posterior à entrada.')
      return
    }

    setSubmitting(true)
    try {
      await createReservation({
        user_id: user.id,
        room_id: room.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        guests: Number(guests),
        check_in: checkIn,
        check_out: checkOut,
        notes: notes || null,
      })
      toast.success('Pedido de reserva enviado. Aguarda validação administrativa.')
      navigate('/perfil/reservas')
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar reserva')
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

  if (!room) {
    return (
      <div className="text-center">
        <p>Quarto não encontrado.</p>
        <Link to="/hospedaria" className="mt-3 inline-block text-brand-700">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-[2rem]">
        <CardMedia src={room.image_url} alt={room.name} className="h-72" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/55 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-500">Hospedaria</p>
            <h1 className="font-display text-3xl">{room.name}</h1>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(room.price_per_night)} / noite</p>
          </div>
          <Button variant="light" onClick={handleShare} aria-label="Partilhar quarto">
            <Share2 size={16} />
          </Button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-700">{room.description}</p>
      <p className="flex items-center gap-2 text-sm text-ink-700">
        <Users size={16} /> Até {room.max_guests} hóspedes
      </p>
      {room.features ? <p className="text-sm text-ink-500">{room.features}</p> : null}
      <Badge className="bg-brand-700/10 text-brand-800">
        Confirmação apenas após validação administrativa
      </Badge>
      <ClientPaymentInfo
        subject={`Comprovativo — reserva: ${room.name}`}
        amountLabel={`${formatCurrency(room.price_per_night)} / noite`}
        fallbackLabel="Pagamento e confirmação tratados com a empresa"
      />

      <form onSubmit={handleReserve} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-950/5">
        <h2 className="font-display text-lg text-brand-900">Pedir reserva</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Entrada" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
          <Input label="Saída" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
        {availability === false ? (
          <p className="text-sm text-danger">Quarto indisponível neste período.</p>
        ) : availability === true ? (
          <p className="text-sm text-success">Período disponível (sujeito a confirmação).</p>
        ) : null}
        <Input
          label="Número de hóspedes"
          type="number"
          min="1"
          max={room.max_guests}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          required
        />
        <Input label="Nome completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <Input label="Telefone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        <TextArea label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" className="w-full" disabled={submitting || availability === false}>
          {submitting ? 'A enviar...' : user ? 'Enviar pedido de reserva' : 'Entrar para reservar'}
        </Button>
      </form>
    </div>
  )
}
