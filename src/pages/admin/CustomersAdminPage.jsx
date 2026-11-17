import { useEffect, useState } from 'react'
import { Mail, Phone, UserRound, Users } from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { EmptyState, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatDate } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getCustomers } from '@/services/api'

export default function CustomersAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!isSupabaseConfigured) {
          setItems([])
          return
        }
        const data = await getCustomers()
        if (mounted) setItems(data)
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
        tone="light"
        eyebrow="Loja"
        title="Clientes"
        description="Contas registadas na aplicação móvel e web."
        icon={Users}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sem clientes" description="Ainda não há contas registadas." />
      ) : (
        <Panel title="Lista de clientes" description={`${items.length} registado(s)`} icon={Users}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-brand-950/8 text-ink-500">
                <tr>
                  <th className="px-2 py-3 font-medium">Nome</th>
                  <th className="px-2 py-3 font-medium">Telefone</th>
                  <th className="px-2 py-3 font-medium">E-mail</th>
                  <th className="px-2 py-3 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-brand-950/5">
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-2 font-medium text-brand-950">
                        <UserRound size={14} className="text-clay-600" />
                        {item.full_name}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-700">
                        <Phone size={13} className="text-ink-500" />
                        {item.phone || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-700">
                        <Mail size={13} className="text-ink-500" />
                        {item.email || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-ink-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
