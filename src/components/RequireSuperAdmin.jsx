import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui'

export default function RequireSuperAdmin({ children }) {
  const { isSuperAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}
