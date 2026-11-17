import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui'

export default function RequireAuth({ children, admin = false, superAdmin = false }) {
  const { user, isAdmin, isSuperAdmin, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <h2 className="font-display text-xl text-brand-900">Autenticação indisponível</h2>
        <p className="mt-2 text-sm text-ink-500">
          Configure as variáveis do Supabase para activar registo, login e pedidos reais.
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }

  if (superAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (admin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
