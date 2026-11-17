import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui'

/** Bloqueia rotas operacionais da loja para o super_admin (produtor). */
export default function RequireStoreAdmin({ children }) {
  const { isSuperAdmin, isStoreAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isSuperAdmin && !isStoreAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}
