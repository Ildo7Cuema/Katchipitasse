import { useEffect, useState } from 'react'
import { Mail, Shield, UserRound, Users } from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { Badge, EmptyState, Select, Spinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatDate } from '@/lib/format'
import { roleLabel } from '@/lib/roles'
import { getStaffProfiles, updateUserRole } from '@/services/api'

const assignableRoles = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'admin', label: 'Admin (dono da loja)' },
  { value: 'super_admin', label: 'Super Admin (produtor)' },
]

export default function StaffAdminPage() {
  const { user, isSuperAdmin } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  async function load() {
    setItems(await getStaffProfiles())
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar utilizadores')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  if (!isSuperAdmin) {
    return (
      <EmptyState
        title="Acesso restrito"
        description="Apenas o super administrador pode gerir papéis."
      />
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="accent"
        eyebrow="Plataforma"
        title="Utilizadores e papéis"
        description="Controle quem é cliente, admin da loja ou super administrador da plataforma."
        icon={Users}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sem utilizadores" />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Panel
              key={item.id}
              title={item.full_name}
              description={`Desde ${formatDate(item.created_at)}`}
              icon={UserRound}
              actions={
                <Badge
                  className={
                    item.role === 'super_admin'
                      ? 'bg-clay-500/15 text-clay-600'
                      : item.role === 'admin'
                        ? 'bg-brand-950/10 text-brand-950'
                        : 'bg-sand-200 text-ink-700'
                  }
                >
                  {roleLabel(item.role)}
                </Badge>
              }
            >
              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Mail size={16} />
                  {item.email}
                </div>
                <Select
                  label="Papel"
                  icon={Shield}
                  value={item.role}
                  disabled={savingId === item.id || item.id === user?.id}
                  onChange={async (e) => {
                    const nextRole = e.target.value
                    if (nextRole === item.role) return
                    setSavingId(item.id)
                    try {
                      await updateUserRole(item.id, nextRole)
                      toast.success(`Papel actualizado: ${roleLabel(nextRole)}`)
                      await load()
                    } catch (err) {
                      toast.error(err.message || 'Não foi possível alterar o papel')
                    } finally {
                      setSavingId(null)
                    }
                  }}
                >
                  {assignableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
                {item.id === user?.id ? (
                  <p className="text-xs text-ink-500 md:col-span-2">
                    Não pode alterar o seu próprio papel nesta lista.
                  </p>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
