import { useEffect, useState } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { Badge, EmptyState, Select, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatDate, statusLabel, statusTone } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getAllReservations, updateReservationStatus } from '@/services/api'

const statuses = ['pendente', 'confirmada', 'ocupada', 'concluida', 'cancelada']

export default function ReservationsAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!isSupabaseConfigured) {
      setItems([])
      return
    }
    setItems(await getAllReservations())
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="dark"
        eyebrow="Hospedaria"
        title="Reservas"
        description="Pedidos de hospedagem, datas e disponibilidade."
        icon={CalendarDays}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sem reservas"
          description={isSupabaseConfigured ? 'Ainda não há reservas.' : 'Configure o Supabase para gerir reservas.'}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Panel
              key={item.id}
              title={item.rooms?.name || 'Quarto'}
              description={`${item.customer_name} · ${item.customer_phone || 'Sem telefone'}`}
              icon={CalendarDays}
              actions={<Badge className={statusTone(item.status)}>{statusLabel(item.status)}</Badge>}
            >
              <p className="text-sm text-ink-700">
                {formatDate(item.check_in)} → {formatDate(item.check_out)} · {item.guests} hóspede(s)
              </p>
              <div className="mt-4 max-w-xs">
                <Select
                  label="Actualizar estado"
                  icon={RefreshCw}
                  value={item.status}
                  onChange={async (e) => {
                    try {
                      await updateReservationStatus(item.id, e.target.value)
                      toast.success('Reserva actualizada')
                      await load()
                    } catch (err) {
                      toast.error(err.message)
                    }
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </Select>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
