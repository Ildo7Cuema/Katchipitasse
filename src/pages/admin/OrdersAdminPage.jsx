import { useEffect, useState } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { Badge, EmptyState, Select, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate, statusLabel, statusTone } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getAllOrders, updateOrderStatus } from '@/services/api'

const statuses = ['pendente', 'confirmado', 'em_preparacao', 'concluido', 'cancelado']

export default function OrdersAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!isSupabaseConfigured) {
      setItems([])
      return
    }
    setItems(await getAllOrders())
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        toast.error(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="accent"
        eyebrow="Restaurante"
        title="Pedidos"
        description="Acompanhe solicitações e actualize o estado de preparação."
        icon={ClipboardList}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sem pedidos"
          description={isSupabaseConfigured ? 'Ainda não há solicitações.' : 'Configure o Supabase para gerir pedidos.'}
        />
      ) : (
        <div className="space-y-4">
          {items.map((order) => (
            <Panel
              key={order.id}
              title={order.customer_name}
              description={`${order.customer_phone || 'Sem telefone'} · ${formatDate(order.created_at)}`}
              icon={ClipboardList}
              actions={<Badge className={statusTone(order.status)}>{statusLabel(order.status)}</Badge>}
            >
              <ul className="space-y-1 text-sm text-ink-700">
                {(order.order_items || []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>
                      {item.quantity}× {item.dish_name}
                    </span>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 max-w-xs">
                <Select
                  label="Actualizar estado"
                  icon={RefreshCw}
                  value={order.status}
                  onChange={async (e) => {
                    try {
                      await updateOrderStatus(order.id, e.target.value)
                      toast.success('Estado actualizado')
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
