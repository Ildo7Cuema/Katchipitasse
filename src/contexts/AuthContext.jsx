import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isStaffRole, isSuperAdminRole } from '@/lib/roles'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      console.error(error)
      setProfile(null)
      return null
    }
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let mounted = true

    async function init() {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    }

    init()

    if (!isSupabaseConfigured) return undefined

    // Evitar await directo no callback (pode causar deadlock com signIn)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, fullName, phone }) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session)
    const nextProfile = data.user ? await loadProfile(data.user.id) : null
    return { ...data, profile: nextProfile }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const redirectTo = `${window.location.origin}/redefinir-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) return loadProfile(session.user.id)
    return null
  }, [loadProfile, session])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      isAdmin: isStaffRole(profile?.role),
      isSuperAdmin: isSuperAdminRole(profile?.role),
      isStoreAdmin: profile?.role === 'admin',
      isConfigured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
