import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import { Button, Input, PageHeader, PasswordInput } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const { settings } = useCompany()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const from = location.state?.from || '/perfil'

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { profile } = await signIn({ email, password })
      toast.success('Sessão iniciada')
      if (profile?.role === 'admin') {
        // Admin da loja → painel operacional
        navigate(from?.startsWith('/admin') && !from.includes('assinaturas') && !from.includes('regras') && !from.includes('plataforma') && !from.includes('utilizadores')
          ? from
          : '/admin', { replace: true })
      } else if (profile?.role === 'super_admin') {
        // Super Admin → monitorização da plataforma
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true })
      } else {
        navigate(from === '/admin' ? '/perfil' : from, { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <BrandLogo
        src={settings.logo_url || '/logo.png'}
        alt={settings.company_name}
        className="mx-auto mb-4 max-w-[220px] bg-transparent"
        imgClassName="max-h-20"
      />
      <PageHeader title="Entrar" subtitle="Aceda à sua conta para pedidos e reservas." />
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput
          label="Palavra-passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </Button>
        <p className="text-center text-sm text-ink-500">
          <Link to="/recuperar-password" className="text-brand-700">
            Recuperar palavra-passe
          </Link>
        </p>
        <p className="text-center text-sm text-ink-500">
          Não tem conta?{' '}
          <Link to="/registar" className="font-medium text-brand-700">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const { settings } = useCompany()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await signUp(form)
      toast.success('Conta criada. Verifique o e-mail se a confirmação estiver activa.')
      navigate('/perfil')
    } catch (err) {
      toast.error(err.message || 'Falha no registo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <BrandLogo
        src={settings.logo_url || '/logo.png'}
        alt={settings.company_name}
        className="mx-auto mb-4 max-w-[220px] bg-transparent"
        imgClassName="max-h-20"
      />
      <PageHeader title="Criar conta" subtitle="Registe-se para solicitar refeições e reservas." />
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <Input label="Nome completo" value={form.fullName} onChange={update('fullName')} required />
        <Input label="Telefone" value={form.phone} onChange={update('phone')} required />
        <Input label="E-mail" type="email" value={form.email} onChange={update('email')} required />
        <PasswordInput
          label="Palavra-passe"
          value={form.password}
          onChange={update('password')}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A criar...' : 'Registar'}
        </Button>
        <p className="text-center text-sm text-ink-500">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-medium text-brand-700">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      toast.success('Se o e-mail existir, enviámos instruções de recuperação.')
    } catch (err) {
      toast.error(err.message || 'Erro ao recuperar palavra-passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <PageHeader title="Recuperar palavra-passe" subtitle="Receba um link no seu e-mail." />
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A enviar...' : 'Enviar link'}
        </Button>
        <p className="text-center text-sm">
          <Link to="/entrar" className="text-brand-700">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  )
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      toast.success('Palavra-passe actualizada')
      navigate('/entrar')
    } catch (err) {
      toast.error(err.message || 'Erro ao actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <PageHeader title="Nova palavra-passe" />
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <PasswordInput
          label="Nova palavra-passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </Button>
      </form>
    </div>
  )
}
