import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCompanySettings } from '@/services/api'
import { demoSettings } from '@/lib/demoData'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const [settings, setSettings] = useState(demoSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getCompanySettings()
        if (mounted) setSettings(data)
      } catch (err) {
        if (mounted) setError(err.message || 'Erro ao carregar configurações')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      loading,
      error,
      refresh: async () => {
        const data = await getCompanySettings()
        setSettings(data)
        return data
      },
    }),
    [settings, loading, error],
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany deve ser usado dentro de CompanyProvider')
  return ctx
}
